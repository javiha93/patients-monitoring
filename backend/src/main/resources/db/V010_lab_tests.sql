-- Lab tests & results tables
-- Run on Railway PostgreSQL: viaduct.proxy.rlwy.net:53425

CREATE TABLE IF NOT EXISTS lab_tests (
    id              BIGSERIAL PRIMARY KEY,
    admission_id    BIGINT NOT NULL REFERENCES admissions(id),
    category        VARCHAR(50) NOT NULL,
    label           VARCHAR(255) NOT NULL,
    status          VARCHAR(50) NOT NULL,
    external_id     VARCHAR(100) UNIQUE,
    requested_at    TIMESTAMP NOT NULL,
    validated_at    TIMESTAMP,
    received_at     TIMESTAMP,
    requested_by    VARCHAR(255),
    notes           TEXT,
    created_at      TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lab_results (
    id              BIGSERIAL PRIMARY KEY,
    lab_test_id     BIGINT NOT NULL REFERENCES lab_tests(id) ON DELETE CASCADE,
    category        VARCHAR(100) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    value           VARCHAR(255),
    unit            VARCHAR(50),
    ref_range       VARCHAR(100),
    flag            VARCHAR(20),
    created_at      TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lab_tests_admission ON lab_tests(admission_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_external_id ON lab_tests(external_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_test ON lab_results(lab_test_id);
