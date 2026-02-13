package com.relaydocs.documentservice.events;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@ConditionalOnProperty(name = "relaydocs.events.kafka.enabled", havingValue = "false", matchIfMissing = true)
public class NoopDomainEventPublisher implements DomainEventPublisher {

    @Override
    public void publish(String eventType, String aggregateId, Map<String, Object> payload) {
        // Intentionally no-op when Kafka publishing is not enabled.
    }
}
