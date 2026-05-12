-- Seed lab tests for existing patients on Railway
-- Run AFTER V010_lab_tests.sql and after deploy creates the tables

-- Patient 1: 3 lab tests (various statuses)
INSERT INTO lab_tests (admission_id, category, label, status, external_id, requested_at, validated_at, received_at, requested_by, notes, created_at)
SELECT a.id, 'analitica', 'Hemograma + Bioquímica + Coagulación', 'results', 'LAB-2024-00101',
       a.admission_date + INTERVAL '2 hours',
       a.admission_date + INTERVAL '2 hours 15 minutes',
       a.admission_date + INTERVAL '4 hours',
       'Dr. García', NULL, NOW()
FROM admissions a
JOIN patients p ON a.patient_id = p.id
WHERE a.discharged_at IS NULL
ORDER BY p.id ASC LIMIT 1;

INSERT INTO lab_tests (admission_id, category, label, status, external_id, requested_at, validated_at, received_at, requested_by, notes, created_at)
SELECT a.id, 'cultivo', 'Hemocultivo x2', 'pending_receipt', 'LAB-2024-00102',
       a.admission_date + INTERVAL '3 hours',
       a.admission_date + INTERVAL '3 hours 10 minutes',
       NULL,
       'Dr. García', 'Sospecha de bacteriemia', NOW()
FROM admissions a
JOIN patients p ON a.patient_id = p.id
WHERE a.discharged_at IS NULL
ORDER BY p.id ASC LIMIT 1;

INSERT INTO lab_tests (admission_id, category, label, status, external_id, requested_at, validated_at, received_at, requested_by, notes, created_at)
SELECT a.id, 'analitica', 'Gasometría arterial', 'pending_validation', NULL,
       NOW() - INTERVAL '30 minutes',
       NULL, NULL,
       'Dr. López', NULL, NOW()
FROM admissions a
JOIN patients p ON a.patient_id = p.id
WHERE a.discharged_at IS NULL
ORDER BY p.id ASC LIMIT 1;

-- Patient 2: 2 lab tests
INSERT INTO lab_tests (admission_id, category, label, status, external_id, requested_at, validated_at, received_at, requested_by, notes, created_at)
SELECT a.id, 'analitica', 'Bioquímica urgente', 'partial_results', 'LAB-2024-00201',
       a.admission_date + INTERVAL '1 hour',
       a.admission_date + INTERVAL '1 hour 5 minutes',
       a.admission_date + INTERVAL '3 hours',
       'Dr. Martínez', NULL, NOW()
FROM admissions a
JOIN patients p ON a.patient_id = p.id
WHERE a.discharged_at IS NULL
ORDER BY p.id ASC LIMIT 1 OFFSET 1;

INSERT INTO lab_tests (admission_id, category, label, status, external_id, requested_at, validated_at, received_at, requested_by, notes, created_at)
SELECT a.id, 'cultivo', 'Urocultivo', 'in_progress', 'LAB-2024-00202',
       a.admission_date + INTERVAL '5 hours',
       a.admission_date + INTERVAL '5 hours 20 minutes',
       a.admission_date + INTERVAL '6 hours',
       'Dr. Martínez', 'ITU sospechada', NOW()
FROM admissions a
JOIN patients p ON a.patient_id = p.id
WHERE a.discharged_at IS NULL
ORDER BY p.id ASC LIMIT 1 OFFSET 1;

-- Results for Patient 1's "Hemograma + Bioquímica + Coagulación" (status = results)
INSERT INTO lab_results (lab_test_id, category, name, value, unit, ref_range, flag, created_at)
SELECT lt.id, 'Hemograma', 'Hemoglobina', '13.5', 'g/dL', '12.0-16.0', 'normal', NOW()
FROM lab_tests lt WHERE lt.external_id = 'LAB-2024-00101';

INSERT INTO lab_results (lab_test_id, category, name, value, unit, ref_range, flag, created_at)
SELECT lt.id, 'Hemograma', 'Leucocitos', '14.2', 'x10³/µL', '4.0-10.0', 'high', NOW()
FROM lab_tests lt WHERE lt.external_id = 'LAB-2024-00101';

INSERT INTO lab_results (lab_test_id, category, name, value, unit, ref_range, flag, created_at)
SELECT lt.id, 'Hemograma', 'Plaquetas', '245', 'x10³/µL', '150-400', 'normal', NOW()
FROM lab_tests lt WHERE lt.external_id = 'LAB-2024-00101';

INSERT INTO lab_results (lab_test_id, category, name, value, unit, ref_range, flag, created_at)
SELECT lt.id, 'Hemograma', 'Hematocrito', '40.1', '%', '36-46', 'normal', NOW()
FROM lab_tests lt WHERE lt.external_id = 'LAB-2024-00101';

INSERT INTO lab_results (lab_test_id, category, name, value, unit, ref_range, flag, created_at)
SELECT lt.id, 'Bioquímica', 'Glucosa', '142', 'mg/dL', '70-110', 'high', NOW()
FROM lab_tests lt WHERE lt.external_id = 'LAB-2024-00101';

INSERT INTO lab_results (lab_test_id, category, name, value, unit, ref_range, flag, created_at)
SELECT lt.id, 'Bioquímica', 'Creatinina', '0.9', 'mg/dL', '0.6-1.2', 'normal', NOW()
FROM lab_tests lt WHERE lt.external_id = 'LAB-2024-00101';

INSERT INTO lab_results (lab_test_id, category, name, value, unit, ref_range, flag, created_at)
SELECT lt.id, 'Bioquímica', 'Urea', '45', 'mg/dL', '15-45', 'normal', NOW()
FROM lab_tests lt WHERE lt.external_id = 'LAB-2024-00101';

INSERT INTO lab_results (lab_test_id, category, name, value, unit, ref_range, flag, created_at)
SELECT lt.id, 'Bioquímica', 'PCR', '8.5', 'mg/L', '0-5', 'high', NOW()
FROM lab_tests lt WHERE lt.external_id = 'LAB-2024-00101';

INSERT INTO lab_results (lab_test_id, category, name, value, unit, ref_range, flag, created_at)
SELECT lt.id, 'Bioquímica', 'Sodio', '138', 'mEq/L', '135-145', 'normal', NOW()
FROM lab_tests lt WHERE lt.external_id = 'LAB-2024-00101';

INSERT INTO lab_results (lab_test_id, category, name, value, unit, ref_range, flag, created_at)
SELECT lt.id, 'Bioquímica', 'Potasio', '4.1', 'mEq/L', '3.5-5.0', 'normal', NOW()
FROM lab_tests lt WHERE lt.external_id = 'LAB-2024-00101';

INSERT INTO lab_results (lab_test_id, category, name, value, unit, ref_range, flag, created_at)
SELECT lt.id, 'Coagulación', 'INR', '1.1', '', '0.8-1.2', 'normal', NOW()
FROM lab_tests lt WHERE lt.external_id = 'LAB-2024-00101';

INSERT INTO lab_results (lab_test_id, category, name, value, unit, ref_range, flag, created_at)
SELECT lt.id, 'Coagulación', 'Fibrinógeno', '480', 'mg/dL', '200-400', 'high', NOW()
FROM lab_tests lt WHERE lt.external_id = 'LAB-2024-00101';

-- Results for Patient 2's "Bioquímica urgente" (status = partial_results)
INSERT INTO lab_results (lab_test_id, category, name, value, unit, ref_range, flag, created_at)
SELECT lt.id, 'Bioquímica', 'Glucosa', '98', 'mg/dL', '70-110', 'normal', NOW()
FROM lab_tests lt WHERE lt.external_id = 'LAB-2024-00201';

INSERT INTO lab_results (lab_test_id, category, name, value, unit, ref_range, flag, created_at)
SELECT lt.id, 'Bioquímica', 'Creatinina', '1.8', 'mg/dL', '0.6-1.2', 'high', NOW()
FROM lab_tests lt WHERE lt.external_id = 'LAB-2024-00201';

INSERT INTO lab_results (lab_test_id, category, name, value, unit, ref_range, flag, created_at)
SELECT lt.id, 'Bioquímica', 'Potasio', '5.6', 'mEq/L', '3.5-5.0', 'high', NOW()
FROM lab_tests lt WHERE lt.external_id = 'LAB-2024-00201';
