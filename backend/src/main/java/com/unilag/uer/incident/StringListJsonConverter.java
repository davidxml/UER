package com.unilag.uer.incident;

import java.util.List;

import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Serializes a {@link List<String>} attribute to/from a JSONB column. The UER
 * incidents table stores the attached photo data-URLs as jsonb, so the JPA
 * layer converts between the entity's {@code List<String>} and the JSON text
 * the driver writes. Uses the project's Jackson 3 (tools.jackson) mapper.
 */
@Converter
public class StringListJsonConverter implements AttributeConverter<List<String>, String> {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() {};

    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        if (attribute == null) return "[]";
        try {
            return OBJECT_MAPPER.writeValueAsString(attribute);
        } catch (JacksonException e) {
            throw new IllegalStateException("Failed to serialize images to JSONB", e);
        }
    }

    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) return List.of();
        try {
            return OBJECT_MAPPER.readValue(dbData, STRING_LIST);
        } catch (JacksonException e) {
            throw new IllegalStateException("Failed to deserialize images from JSONB", e);
        }
    }
}
