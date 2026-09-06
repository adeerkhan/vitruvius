# Draft: Kubernetes Pod Lifecycle Research

## Research Question
What are the exact states in a Kubernetes Pod lifecycle? Cite the official Kubernetes documentation sections. What hooks exist (postStart, preStop)? What are the restart policies?

## Evidence Table

| Claim | Source | Section | Verified |
|-------|--------|---------|----------|
| Pod phases: Pending, Running, Succeeded, Failed, Unknown | Kubernetes Docs | Pod phase | Yes |
| Pending: Pod accepted but containers not set up | Kubernetes Docs | Pod phase table | Yes |
| Running: Pod bound to node, all containers created, at least one running | Kubernetes Docs | Pod phase table | Yes |
| Succeeded: All containers terminated successfully | Kubernetes Docs | Pod phase table | Yes |
| Failed: All containers terminated, at least one failed | Kubernetes Docs | Pod phase table | Yes |
| Unknown: State could not be obtained | Kubernetes Docs | Pod phase table | Yes |
| Container states: Waiting, Running, Terminated | Kubernetes Docs | Container states | Yes |
| postStart hook executes after container starts | Kubernetes Docs | Running state | Yes |
| preStop hook runs before container enters Terminated state | Kubernetes Docs | Terminated state | Yes |
| restartPolicy values: Always, OnFailure, Never (default: Always) | Kubernetes Docs | Container restarts | Yes |
| Pod conditions: PodScheduled, PodReadyToStartContainers, Initialized, ContainersReady, Ready | Kubernetes Docs | Pod conditions | Yes |

## Findings

### Pod Phases (Kubernetes Documentation: Pod Lifecycle)
Kubernetes defines five distinct phases for a Pod's lifecycle:

1. **Pending**: The Pod has been accepted by the Kubernetes cluster, but one or more containers has not been set up and made ready to run. This includes time spent waiting to be scheduled and downloading container images.

2. **Running**: The Pod has been bound to a node, and all containers have been created. At least one container is still running, or is in the process of starting or restarting.

3. **Succeeded**: All containers in the Pod have terminated in success, and will not be restarted.

4. **Failed**: All containers in the Pod have terminated, and at least one container has terminated in failure (exited with non-zero status or terminated by the system).

5. **Unknown**: The state of the Pod could not be obtained, typically due to an error in communicating with the node.

### Container States
Each container within a Pod has three possible states:
- **Waiting**: Still performing operations to complete start up (pulling images, applying Secrets)
- **Running**: Executing without issues; postStart hook has already executed
- **Terminated**: Ran to completion or failed; preStop hook runs before this state

### Lifecycle Hooks
- **postStart**: Executes immediately after a container is created. The container receives a SIGTERM signal after the postStart hook completes.
- **preStop**: Executes before a container is terminated. The container receives a SIGTERM signal. If the hook times out or fails, the container is terminated anyway.

### Restart Policies
Defined in Pod spec `restartPolicy` field:
- **Always** (default): Restart the container after any termination
- **OnFailure**: Restart only if container exits with non-zero status
- **Never**: Never restart the container

### Pod Conditions
Kubernetes tracks Pod conditions as status markers:
1. **PodScheduled**: Pod has been scheduled to a node
2. **PodReadyToStartContainers**: Sandbox created, networking configured (beta, enabled by default)
3. **Initialized**: All init containers completed successfully
4. **ContainersReady**: All containers in the Pod are ready
5. **Ready**: Pod can serve requests and should be added to load balancing pools

Additional conditions: DisruptionTarget, PodResizePending, PodResizeInProgress

## Sources
1. Kubernetes Documentation - Pod Lifecycle (https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
2. Kubernetes v1.36 Documentation - Pod Lifecycle (https://v1-36.docs.kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
3. Kubernetes Documentation - Pod Conditions (https://kubernetes.io/docs/concepts/workloads/pods/pod-condition/)
