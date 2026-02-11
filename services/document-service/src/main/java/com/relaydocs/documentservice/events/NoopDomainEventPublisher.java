package com.relaydocs.documentservice.events;

import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class NoopDomainEventPublisher implements DomainEventPublisher {

    @Override
    public void publish(String eventType, String aggregateId, Map<String, Object> payload) {
        // Intentionally no-op when Kafka publishing is not enabled.
    }
}