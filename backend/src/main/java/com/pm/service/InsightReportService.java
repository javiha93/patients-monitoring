package com.pm.service;

import com.pm.dto.InsightDismissalDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Generates a clinical report from dismissed insights.
 * Uses OpenAI when OPENAI_API_KEY is configured, otherwise falls back
 * to a structured template-based report.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InsightReportService {

    private final InsightDismissalService dismissalService;

    @Value("${OPENAI_API_KEY:}")
    private String openaiApiKey;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public Map<String, Object> generate(Long admissionId) {
        List<InsightDismissalDTO> dismissals = dismissalService.getByAdmission(admissionId);

        if (dismissals.isEmpty()) {
            return Map.of(
                    "report", "No hay alertas descartadas para este ingreso.",
                    "source", "none",
                    "count", 0
            );
        }

        String report;
        String source;

        if (openaiApiKey != null && !openaiApiKey.isBlank()) {
            try {
                report = generateWithLLM(dismissals);
                source = "openai";
            } catch (Exception e) {
                log.warn("LLM report generation failed, falling back to template: {}", e.getMessage());
                report = generateTemplate(dismissals);
                source = "template_fallback";
            }
        } else {
            report = generateTemplate(dismissals);
            source = "template";
        }

        return Map.of(
                "report", report,
                "source", source,
                "count", dismissals.size()
        );
    }

    /* ── LLM-based report ── */

    private String generateWithLLM(List<InsightDismissalDTO> dismissals) throws Exception {
        StringBuilder context = new StringBuilder();
        for (int i = 0; i < dismissals.size(); i++) {
            InsightDismissalDTO d = dismissals.get(i);
            context.append(String.format(
                    "%d. [%s] %s — %s\n   Motivo de descarte: %s\n   Descartada por: %s (%s)\n\n",
                    i + 1, d.getLevel().toUpperCase(), d.getTitle(), d.getDetail(),
                    d.getReason(), d.getDismissedBy(), d.getDismissedAt().format(FMT)
            ));
        }

        String prompt = """
                Eres un asistente clínico. Analiza las siguientes alertas clínicas que han sido \
                descartadas por el equipo de enfermería durante un ingreso hospitalario. \
                Genera un informe clínico estructurado en español que incluya:
                
                1. **Resumen ejecutivo**: visión general de las alertas descartadas
                2. **Análisis por categoría**: agrupa las alertas por tipo y analiza patrones
                3. **Valoración de riesgos**: identifica si algún descarte podría suponer un riesgo
                4. **Recomendaciones**: sugerencias basadas en los patrones observados
                
                Usa formato Markdown. Sé conciso y clínico.
                
                Alertas descartadas:
                """ + context;

        // Build JSON manually to avoid needing a JSON library
        String escapedPrompt = prompt.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "")
                .replace("\t", "\\t");

        String body = """
                {
                  "model": "gpt-4o-mini",
                  "messages": [{"role": "user", "content": "%s"}],
                  "temperature": 0.3,
                  "max_tokens": 2000
                }
                """.formatted(escapedPrompt);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + openaiApiKey)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .timeout(Duration.ofSeconds(30))
                .build();

        HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("OpenAI API error " + response.statusCode() + ": " + response.body());
        }

        // Extract content from response without a JSON library
        String respBody = response.body();
        int contentIdx = respBody.indexOf("\"content\":");
        if (contentIdx == -1) throw new RuntimeException("Unexpected OpenAI response format");

        // Find the content string value
        int startQuote = respBody.indexOf("\"", contentIdx + 10);
        int endQuote = findClosingQuote(respBody, startQuote + 1);
        String content = respBody.substring(startQuote + 1, endQuote);

        // Unescape JSON string
        return content.replace("\\n", "\n")
                .replace("\\\"", "\"")
                .replace("\\\\", "\\")
                .replace("\\t", "\t");
    }

    private int findClosingQuote(String s, int from) {
        for (int i = from; i < s.length(); i++) {
            if (s.charAt(i) == '\\') { i++; continue; }
            if (s.charAt(i) == '"') return i;
        }
        throw new RuntimeException("Unclosed JSON string");
    }

    /* ── Template-based fallback report ── */

    private String generateTemplate(List<InsightDismissalDTO> dismissals) {
        StringBuilder sb = new StringBuilder();

        sb.append("# Informe de Alertas Clínicas Descartadas\n\n");

        // Summary
        long critical = dismissals.stream().filter(d -> "critical".equals(d.getLevel())).count();
        long warning = dismissals.stream().filter(d -> "warning".equals(d.getLevel())).count();
        long info = dismissals.stream().filter(d -> "info".equals(d.getLevel())).count();

        sb.append("## Resumen\n\n");
        sb.append(String.format("Se han descartado **%d alertas** durante este ingreso", dismissals.size()));
        List<String> parts = new ArrayList<>();
        if (critical > 0) parts.add(critical + " crítica" + (critical > 1 ? "s" : ""));
        if (warning > 0) parts.add(warning + " de atención");
        if (info > 0) parts.add(info + " informativa" + (info > 1 ? "s" : ""));
        if (!parts.isEmpty()) sb.append(" (").append(String.join(", ", parts)).append(")");
        sb.append(".\n\n");

        // Group by analysisType
        Map<String, List<InsightDismissalDTO>> grouped = dismissals.stream()
                .collect(Collectors.groupingBy(InsightDismissalDTO::getAnalysisType,
                        LinkedHashMap::new, Collectors.toList()));

        sb.append("## Detalle por Categoría\n\n");

        for (Map.Entry<String, List<InsightDismissalDTO>> entry : grouped.entrySet()) {
            String type = entry.getKey().replace("_", " ");
            type = type.substring(0, 1).toUpperCase() + type.substring(1);
            List<InsightDismissalDTO> items = entry.getValue();

            sb.append("### ").append(type).append("\n\n");

            for (InsightDismissalDTO d : items) {
                String levelLabel = switch (d.getLevel()) {
                    case "critical" -> "🔴 Crítico";
                    case "warning" -> "🟡 Atención";
                    default -> "🔵 Info";
                };
                sb.append(String.format("- **%s** — %s\n", d.getTitle(), levelLabel));
                sb.append(String.format("  - Detalle: %s\n", d.getDetail()));
                sb.append(String.format("  - **Motivo de descarte**: %s\n", d.getReason()));
                sb.append(String.format("  - Descartada por: %s (%s)\n\n",
                        d.getDismissedBy(), d.getDismissedAt().format(FMT)));
            }
        }

        // Risk note for dismissed criticals
        if (critical > 0) {
            sb.append("## ⚠️ Nota de Riesgo\n\n");
            sb.append(String.format(
                    "Se han descartado **%d alerta%s de nivel crítico**. " +
                    "Se recomienda revisar los motivos de descarte y valorar si las condiciones " +
                    "clínicas han cambiado.\n\n", critical, critical > 1 ? "s" : ""));
        }

        sb.append("---\n");
        sb.append("*Informe generado automáticamente. Para obtener un análisis más detallado, " +
                  "configure OPENAI_API_KEY en las variables de entorno.*\n");

        return sb.toString();
    }
}
