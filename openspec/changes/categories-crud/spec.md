# Specification: Category CRUD with Soft Delete

This document defines the behavior and specifications for Category CRUD operations using Gherkin syntax and RFC 2119 keywords.

## Scenarios

### Scenario 1: Create a new category
- **Given** a valid payload containing `name` and optional `description`
- **When** the client submits a request to `POST /categories`
- **Then** the system MUST create the category
- **And** the category status `isActive` MUST default to `true`
- **And** the system MUST return the created category with status `201 Created`

### Scenario 2: Create a category with duplicate name
- **Given** a category with name "Electronics" already exists in the system
- **When** the client submits a request to `POST /categories` with name "Electronics"
- **Then** the system MUST fail the operation
- **And** the system MUST return a `409 Conflict` (or `400 Bad Request` validation error)

### Scenario 3: Update a category
- **Given** an existing category with ID "cat-uuid-1"
- **When** the client submits a request to `PUT /categories/cat-uuid-1` with updated fields
- **Then** the system MUST update the fields in the database
- **And** the system MUST return the updated category with status `200 OK`

### Scenario 4: Deactivate a category (Logical Soft Delete)
- **Given** an active category with ID "cat-uuid-1"
- **When** the client submits a request to `PATCH /categories/cat-uuid-1/deactivate`
- **Then** the system MUST set `isActive` to `false`
- **And** the system MUST update `updatedAt` to the current timestamp
- **And** the system MUST return the updated category with status `200 OK`

### Scenario 5: Delete category with no associated products
- **Given** an existing category with ID "cat-uuid-1"
- **And** the category has no associated products
- **When** the client submits a request to `DELETE /categories/cat-uuid-1`
- **Then** the system MUST physically delete the category row from the database
- **And** the system MUST return status `204 No Content`

### Scenario 6: Delete category with associated products
- **Given** an existing category with ID "cat-uuid-1"
- **And** there is at least one product associated with this category
- **When** the client submits a request to `DELETE /categories/cat-uuid-1`
- **Then** the system MUST NOT delete the category
- **And** the system MUST throw a `BusinessRuleException`
- **And** the system MUST return status `400 Bad Request` (or `422 Unprocessable Entity`)

### Scenario 7: List categories
- **Given** multiple categories in the system
- **When** the client submits a request to `GET /categories` with pagination parameters `page` and `limit`
- **Then** the system MUST return a paginated list of categories with pagination metadata
