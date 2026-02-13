package com.relaydocs.documentservice.events;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "relaydocs.events")
public class RelayEventProperties {

    private String kafkaTopic = "relaydocs.domain-events";
    private String kafkaConsumerGroupId = "relaydocs-document-service-consumer";
    private String kafkaConsumerName = "document-service";

    public String getKafkaTopic() {
        return kafkaTopic;
    }

    public void setKafkaTopic(String kafkaTopic) {
        this.kafkaTopic = kafkaTopic;
    }

    public String getKafkaConsumerGroupId() {
        return kafkaConsumerGroupId;
    }

    public void setKafkaConsumerGroupId(String kafkaConsumerGroupId) {
        this.kafkaConsumerGroupId = kafkaConsumerGroupId;
    }

    public String getKafkaConsumerName() {
        return kafkaConsumerName;
    }

    public void setKafkaConsumerName(String kafkaConsumerName) {
        this.kafkaConsumerName = kafkaConsumerName;
    }
}
