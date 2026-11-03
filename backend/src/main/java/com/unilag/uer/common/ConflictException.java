package com.unilag.uer.common;

/** A uniqueness/business conflict that maps to HTTP 409. */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
