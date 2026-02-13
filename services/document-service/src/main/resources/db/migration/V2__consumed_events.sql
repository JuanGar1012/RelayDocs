CREATE TABLE consumed_events (
    id BIGSERIAL PRIMARY KEY,
    consumer_name VARCHAR(120) NOT NULL,
    event_id VARCHAR(128) NOT NULL,
    event_type VARCHAR(120) NOT NULL,
    aggregate_id VARCHAR(120) NOT NULL,
    occurred_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_consumed_events_consumer_event UNIQUE (consumer_name, event_id)
);

CREATE INDEX idx_consumed_events_consumer_processed_at
    ON consumed_events (consumer_name, processed_at DESC);
