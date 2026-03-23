Axios API Layer Rules
Goal

The project must implement a typed, testable, and scalable API service layer based on:

Axios

Feature-Based architecture

TanStack Query

A strict rule applies:

UI components must never interact with Axios directly.

UI must only call feature service functions.

Folder Structure

The API layer is organized per feature.

src/

lib/
api.ts
api-auth.ts
queryClient.ts

Modules/
Users/
api/
routes.ts
dto.ts
service.ts
client.ts
index.ts
Core Axios Client

The base Axios instance must live in:

src/lib/api.ts

Responsibilities:

baseURL configuration

global headers

timeout configuration

request tracing

unified error mapping

All errors must be mapped to a single error type.

Example error structure:

ApiError

Fields:

status

message

code

validation fields

raw payload

UI and hooks must only handle ApiError.

Authentication Handling

The API layer must remain decoupled from UI logic.

Authentication must be injected using setter functions.

Example:

setAccessTokenGetter
setOnUnauthorized

These functions allow the application root to configure:

token retrieval

logout behaviour

redirect logic

The API layer must never depend on:

router

UI state

toast systems

API Conventions

The following conventions must be respected.

1 UI must not use Axios

Forbidden:

axios.get(...)

Allowed:

fetchUsers()
createUser()
2 DTOs must be typed

Every API request and response must have DTO types.

Location:

api/dto.ts
3 Endpoints must be centralized

API routes must be defined in:

routes.ts

Avoid scattered URL strings.

Forbidden:

api.get("/users")

Preferred:

USERS_ROUTES.base
4 Unified error model

All API errors must be mapped to:

ApiError

No raw Axios errors should reach UI.

5 Support request cancellation

All service functions must accept:

AbortSignal

Example:

fetchUsers(params, signal)

This enables proper cancellation via TanStack Query.

6 Timeout and retries

Timeout must be defined at the Axios instance level.

Retries must not be implemented in interceptors.

Retry logic must be handled by TanStack Query.

7 File uploads

File uploads must use:

FormData
multipart/form-data

Optional progress tracking via:

onUploadProgress
8 Idempotency

Sensitive POST operations may include:

X-Idempotency-Key

This prevents duplicate requests.

Feature API Example

Feature example:

Modules/Users/api

Files:

routes.ts
dto.ts
service.ts
routes.ts

Defines API endpoints.

Example:

USERS_ROUTES.base
USERS_ROUTES.byId
dto.ts

Defines request and response types.

Examples:

User

CreateUserDto

UpdateUserDto

service.ts

Contains pure Axios request functions.

Examples:

fetchUsers
fetchUser
createUser
updateUser
deleteUser

Service functions must only:

call Axios

return data

throw ApiError

They must never contain:

routing logic

toast notifications

UI behavior

Integration with TanStack Query

Service functions must be used inside Query hooks.

Example pattern:

useQuery
useMutation

Query functions must pass the AbortSignal.

Example:

queryFn: ({ signal }) => fetchUsers(params, signal)
Error Handling

401 responses must trigger:

onUnauthorized()

The actual logout or redirect behavior must be handled at the application root.

Forbidden inside service layer:

router navigation

toast messages

global state changes

Testing Rules

Service functions must be tested independently from UI.

Recommended tools:

Jest

MSW (Mock Service Worker)

All error responses must return ApiError.

Dependency Rules

Allowed dependencies:

Modules/api → lib/api
Query hooks → service.ts
Modules → Shared UI

Forbidden dependencies:

UI components → Axios
service.ts → UI components
service.ts → Router
service.ts → Toast systems
Do / Don't
Do

Define DTO types

Centralize API routes

Pass AbortSignal

Map errors to ApiError

Keep service layer pure

Don't

Use Axios in components

Scatter endpoint strings

Handle UI logic inside services

Implement retry logic in interceptors

Pull Request Checklist

Before merging:

UI calls service functions only

DTO types are defined

routes.ts is used for endpoints

ApiError is returned consistently

queryFn functions support AbortSignal

uploads use proper headers

unauthorized flow documented and tested
