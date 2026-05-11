package com.pm;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pm.dto.CreatePatientRequest;
import com.pm.dto.DeviceDTO;
import com.pm.dto.DischargeRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class DeviceApiTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper mapper;

    private Long[] createPatientAndAdmission() throws Exception {
        CreatePatientRequest req = new CreatePatientRequest();
        req.setNhc("NHC-DEV");
        req.setFirstName("Test");
        req.setLastName("Device");
        req.setBirthDate(LocalDate.of(1990, 1, 1));
        req.setSex("male");
        req.setTriageLevel(3);
        req.setMatCategory("Test");
        req.setLocation("B1");

        String response = mvc.perform(post("/api/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
                .andReturn().getResponse().getContentAsString();

        Long patientId = mapper.readTree(response).get("id").asLong();
        Long admissionId = mapper.readTree(response).get("activeAdmission").get("id").asLong();
        return new Long[]{patientId, admissionId};
    }

    private Long createDevice(Long admissionId, String category, String type) throws Exception {
        DeviceDTO dto = DeviceDTO.builder()
                .admissionId(admissionId)
                .category(category)
                .type(type)
                .insertedAt(LocalDateTime.now())
                .build();

        String response = mvc.perform(post("/api/devices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return mapper.readTree(response).get("id").asLong();
    }

    @Test
    @DisplayName("has-active devuelve true solo para dispositivos activos")
    void hasActiveByType() throws Exception {
        Long[] ids = createPatientAndAdmission();
        Long admissionId = ids[1];

        // No device yet
        mvc.perform(get("/api/devices/admission/" + admissionId + "/has-active")
                .param("type", "sonda_vesical"))
                .andExpect(status().isOk())
                .andExpect(content().string("false"));

        // Create active sonda vesical
        Long deviceId = createDevice(admissionId, "elimination", "sonda_vesical");

        mvc.perform(get("/api/devices/admission/" + admissionId + "/has-active")
                .param("type", "sonda_vesical"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));

        // Retire the device
        DeviceDTO update = DeviceDTO.builder()
                .removedAt(LocalDateTime.now())
                .insertedAt(LocalDateTime.now().minusHours(1))
                .build();
        mvc.perform(put("/api/devices/" + deviceId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(update)))
                .andExpect(status().isOk());

        // Should be false again after retirement
        mvc.perform(get("/api/devices/admission/" + admissionId + "/has-active")
                .param("type", "sonda_vesical"))
                .andExpect(status().isOk())
                .andExpect(content().string("false"));
    }

    @Test
    @DisplayName("Alta hospitalaria retira dispositivos vasculares automáticamente")
    void dischargeRetiresVascularDevices() throws Exception {
        Long[] ids = createPatientAndAdmission();
        Long patientId = ids[0];
        Long admissionId = ids[1];

        // Create vascular devices
        createDevice(admissionId, "vascular", "via_periferica");
        createDevice(admissionId, "vascular", "via_central");

        // Create non-vascular devices
        createDevice(admissionId, "elimination", "sonda_vesical");
        createDevice(admissionId, "gastrointestinal", "sng");

        // Verify all 4 are active
        mvc.perform(get("/api/devices/admission/" + admissionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[?(@.removedAt != null)]", hasSize(0)));

        // Discharge patient
        mvc.perform(post("/api/patients/" + patientId + "/discharge")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new DischargeRequest())))
                .andExpect(status().isOk());

        // Vascular devices should be retired, others should remain active
        mvc.perform(get("/api/devices/admission/" + admissionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)))
                // 2 vascular retired
                .andExpect(jsonPath("$[?(@.category == 'vascular' && @.removedAt != null)]", hasSize(2)))
                // sonda vesical still active
                .andExpect(jsonPath("$[?(@.category == 'elimination' && @.removedAt == null)]", hasSize(1)))
                // SNG still active
                .andExpect(jsonPath("$[?(@.category == 'gastrointestinal' && @.removedAt == null)]", hasSize(1)));
    }

    @Test
    @DisplayName("Se puede eliminar un dispositivo retirado")
    void deleteRetiredDevice() throws Exception {
        Long[] ids = createPatientAndAdmission();
        Long admissionId = ids[1];

        Long deviceId = createDevice(admissionId, "vascular", "via_periferica");

        // Retire it
        DeviceDTO update = DeviceDTO.builder()
                .removedAt(LocalDateTime.now())
                .insertedAt(LocalDateTime.now().minusHours(1))
                .build();
        mvc.perform(put("/api/devices/" + deviceId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(update)))
                .andExpect(status().isOk());

        // Delete the retired device
        mvc.perform(delete("/api/devices/" + deviceId))
                .andExpect(status().isNoContent());

        // Should be gone
        mvc.perform(get("/api/devices/admission/" + admissionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
