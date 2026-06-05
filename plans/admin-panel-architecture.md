# Admin Panel Architecture Diagram

## Current vs Proposed Architecture

### Current Flow (Broken)

```mermaid
graph TD
    A[Admin clicks Add Package] --> B[JavaScript creates temp ID]
    B --> C[Adds card to DOM with pkg-timestamp]
    C --> D[Admin fills form]
    D --> E[Clicks Save]
    E --> F[POST /admin/panel with temp ID]
    F --> G{Backend checks if ID exists}
    G -->|Not found| H[Calls createPackage]
    H --> I[Supabase generates NEW UUID]
    I --> J[Package saved with different ID]
    J --> K[Form data with temp ID lost]
    
    style K fill:#f99,stroke:#f00
    
    L[Admin clicks Delete] --> M[Confirmation dialog]
    M --> N[Remove card from DOM]
    N --> O[Form submitted]
    O --> P[Package still in database]
    
    style P fill:#f99,stroke:#f00
```

### Proposed Flow (Fixed)

```mermaid
graph TD
    A[Admin clicks Add Package] --> B[AJAX POST /admin/panel/create]
    B --> C[Backend creates package with UUID]
    C --> D[Returns new package data]
    D --> E[Add row to table with real UUID]
    E --> F[Admin can edit inline or in modal]
    
    style E fill:#9f9,stroke:#0f0
    
    G[Admin clicks Delete] --> H[Confirmation dialog]
    H --> I[AJAX POST /admin/panel/delete/:id]
    I --> J[Backend deletes from Supabase]
    J --> K[Success response]
    K --> L[Remove row from table]
    
    style L fill:#9f9,stroke:#0f0
```

## Component Architecture

```mermaid
graph LR
    subgraph Frontend
        A[Admin Panel View]
        B[Table Component]
        C[Edit Modal/Inline Form]
        D[Search & Filter]
        E[Pagination Controls]
    end
    
    subgraph Backend
        F[GET /admin/panel]
        G[POST /admin/panel/create]
        H[POST /admin/panel]
        I[POST /admin/panel/delete/:id]
    end
    
    subgraph Services
        J[supabaseStorage.js]
        K[getPackages]
        L[createPackage]
        M[updatePackage]
        N[deletePackage]
    end
    
    subgraph Database
        O[(Supabase packages table)]
    end
    
    A --> B
    A --> D
    A --> E
    B --> C
    
    A -->|Load packages| F
    B -->|Create new| G
    C -->|Update| H
    B -->|Delete| I
    
    F --> K
    G --> L
    H --> M
    I --> N
    
    K --> O
    L --> O
    M --> O
    N --> O
```

## Table Layout Structure

```mermaid
graph TD
    A[Admin Panel Container] --> B[Header Section]
    A --> C[Controls Section]
    A --> D[Table Section]
    A --> E[Pagination Section]
    
    B --> B1[Title]
    B --> B2[Add Package Button]
    B --> B3[Gallery Link]
    B --> B4[Logout Link]
    
    C --> C1[Search Input]
    C --> C2[Filter Dropdown]
    C --> C3[Save All Button]
    
    D --> D1[Table Header]
    D --> D2[Table Body]
    
    D1 --> D1A[Visible Checkbox]
    D1 --> D1B[ID Column]
    D1 --> D1C[Event Name Column]
    D1 --> D1D[Price Column]
    D1 --> D1E[Dates Column]
    D1 --> D1F[Photo Column]
    D1 --> D1G[Actions Column]
    
    D2 --> D2A[Package Rows]
    D2A --> D2B[Edit Button]
    D2A --> D2C[Delete Button]
    
    E --> E1[Items Count]
    E --> E2[Page Numbers]
    E --> E3[Prev/Next Buttons]
```

## Data Flow for CRUD Operations

```mermaid
sequenceDiagram
    participant U as Admin User
    participant F as Frontend
    participant B as Backend API
    participant S as Supabase Service
    participant D as Database
    
    Note over U,D: CREATE Operation
    U->>F: Click "Add Package"
    F->>B: POST /admin/panel/create
    B->>S: createPackage({})
    S->>D: INSERT with UUID
    D-->>S: Return new package
    S-->>B: Package with UUID
    B-->>F: JSON response
    F->>F: Add row to table
    
    Note over U,D: UPDATE Operation
    U->>F: Edit package & save
    F->>B: POST /admin/panel
    B->>S: updatePackage(id, data)
    S->>D: UPDATE WHERE id=uuid
    D-->>S: Success
    S-->>B: Updated package
    B-->>F: Redirect/Success
    
    Note over U,D: DELETE Operation
    U->>F: Click delete button
    F->>U: Confirm dialog
    U->>F: Confirm
    F->>B: POST /admin/panel/delete/:id
    B->>S: deletePackage(id)
    S->>D: DELETE WHERE id=uuid
    D-->>S: Success
    S-->>B: Success
    B-->>F: 200 OK
    F->>F: Remove row from table
```

## Responsive Design Breakpoints

```mermaid
graph LR
    A[Screen Size] --> B{Width?}
    B -->|< 768px| C[Mobile View]
    B -->|768-1024px| D[Tablet View]
    B -->|> 1024px| E[Desktop View]
    
    C --> C1[Compact Cards]
    C --> C2[Stack Columns]
    C --> C3[Simplified Actions]
    
    D --> D1[Condensed Table]
    D --> D2[Hide Less Important Columns]
    D --> D3[Icon-only Actions]
    
    E --> E1[Full Table]
    E --> E2[All Columns Visible]
    E --> E3[Text + Icon Actions]
```

## State Management

```mermaid
stateDiagram-v2
    [*] --> Loading: Page Load
    Loading --> Loaded: Packages Fetched
    Loaded --> Editing: Click Edit
    Loaded --> Creating: Click Add
    Loaded --> Deleting: Click Delete
    
    Editing --> Saving: Submit Form
    Creating --> Saving: Submit Form
    Deleting --> Confirming: Show Dialog
    
    Confirming --> Deleting: Cancel
    Confirming --> Removing: Confirm
    
    Saving --> Loaded: Success
    Saving --> Error: Failure
    Removing --> Loaded: Success
    Removing --> Error: Failure
    
    Error --> Loaded: Retry/Dismiss
    
    Loaded --> Searching: Type in Search
    Searching --> Loaded: Clear Search
    
    Loaded --> Paginating: Change Page
    Paginating --> Loaded: Page Changed
```

## Error Handling Flow

```mermaid
graph TD
    A[User Action] --> B{Action Type}
    
    B -->|Create| C[POST /admin/panel/create]
    B -->|Update| D[POST /admin/panel]
    B -->|Delete| E[POST /admin/panel/delete/:id]
    
    C --> F{Success?}
    D --> F
    E --> F
    
    F -->|Yes| G[Update UI]
    F -->|No| H[Show Error Message]
    
    G --> I[Show Success Toast]
    H --> J{Error Type}
    
    J -->|Network| K[Retry Button]
    J -->|Validation| L[Highlight Fields]
    J -->|Server| M[Contact Admin]
    
    K --> A
    L --> A
    M --> N[Log Error]
```

## Security Considerations

```mermaid
graph TD
    A[Admin Request] --> B{Authenticated?}
    B -->|No| C[Redirect to Login]
    B -->|Yes| D{Session Valid?}
    
    D -->|No| C
    D -->|Yes| E{CSRF Token Valid?}
    
    E -->|No| F[403 Forbidden]
    E -->|Yes| G{Input Validated?}
    
    G -->|No| H[400 Bad Request]
    G -->|Yes| I{Rate Limited?}
    
    I -->|Yes| J[429 Too Many Requests]
    I -->|No| K[Process Request]
    
    K --> L{Supabase RLS}
    L --> M[Execute Query]
    M --> N[Return Response]
```

## Performance Optimization Strategy

```mermaid
graph LR
    A[Performance Goals] --> B[Frontend]
    A --> C[Backend]
    A --> D[Database]
    
    B --> B1[Lazy Load Images]
    B --> B2[Virtual Scrolling]
    B --> B3[Debounce Search]
    B --> B4[Cache Package List]
    
    C --> C1[Compress Responses]
    C --> C2[Batch Updates]
    C --> C3[Connection Pooling]
    
    D --> D1[Index on visible]
    D --> D2[Index on created_at]
    D --> D3[Limit Query Results]
```
