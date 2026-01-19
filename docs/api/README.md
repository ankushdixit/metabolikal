# API Documentation

## Health Check Endpoint

### GET /api/health

Returns the health status of the application, including database connectivity.

#### Response

**Success Response (200 OK)**

```json
{
  "status": "ok",
  "timestamp": "2026-01-19T10:00:00.000Z",
  "database": "connected"
}
```

**Degraded Response (503 Service Unavailable)**

```json
{
  "status": "degraded",
  "timestamp": "2026-01-19T10:00:00.000Z",
  "database": "disconnected"
}
```

#### Fields

| Field       | Type                            | Description                                               |
| ----------- | ------------------------------- | --------------------------------------------------------- |
| `status`    | `"ok" \| "degraded"`            | Overall health status of the application                  |
| `timestamp` | `string`                        | ISO 8601 timestamp of when the health check was performed |
| `database`  | `"connected" \| "disconnected"` | Database connectivity status                              |

#### Usage

```bash
# Check health status
curl http://localhost:3000/api/health

# Check in deployment monitoring
curl -f http://localhost:3000/api/health || echo "Health check failed"
```

#### Use Cases

- **Load Balancer Health Checks**: Configure your load balancer to use this endpoint to determine if an instance is healthy
- **Deployment Verification**: Check the endpoint after deployment to ensure the application started correctly
- **Monitoring Systems**: Integrate with monitoring tools to track application availability
- **Kubernetes Liveness/Readiness Probes**: Use as a liveness probe to restart unhealthy pods
