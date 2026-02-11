package com.relaydocs.documentservice.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class UserEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, length = 100)
    private String id;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    protected UserEntity() {
    }

    public UserEntity(String id, String email) {
        this.id = id;
        this.email = email;
    }

    public String getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }
}