package com.relaydocs.documentservice.domain;

import com.fasterxml.jackson.annotation.JsonCreator;

import java.util.Locale;

public enum PermissionRole {
    VIEWER,
    EDITOR;

    @JsonCreator
    public static PermissionRole fromValue(String value) {
        if (value == null) {
            throw new IllegalArgumentException("Role is required");
        }

        return PermissionRole.valueOf(value.toUpperCase(Locale.ROOT));
    }
}