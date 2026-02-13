package com.relaydocs.documentservice.events;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
public class KafkaConsumerConfiguration {

    @Bean
    public DefaultErrorHandler kafkaConsumerErrorHandler() {
        // Retry transient failures twice after the initial attempt; malformed payloads are not retried.
        DefaultErrorHandler errorHandler = new DefaultErrorHandler(new FixedBackOff(500L, 2L));
        errorHandler.addNotRetryableExceptions(IllegalArgumentException.class);
        return errorHandler;
    }
}
