package com.relaydocs.documentservice.service;

public class ApiUnauthorizedException extends RuntimeException {
    public ApiUnauthorizedException(String message) {
        super(message);
    }
}
