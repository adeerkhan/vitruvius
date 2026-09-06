# Fixture: FMEA Brainstorm Test Input

## System Description
Additively manufactured (LPBF) Ti-6Al-4V bracket for aircraft galley monument attachment.

## Operating Conditions
- Loading: HCF (ground-air-ground cycles) + LCF (maneuver loads)
- Temperature: -54°C to +85°C, occasional thermal spikes to +120°C
- Environment: Cabin pressure, occasional galley fluid exposure, salt spray (coastal ops)
- Service life: 20 years / 60,000 flight hours
- Criticality: HIGH — failure could cause galley detachment (FAA AC 25.571-1D)

## Expected Output Shape
- 10-20 failure modes across categories: build defects, residual stress, surface, microstructure, fatigue, environment, overload, NDE
- Each with: Component, Failure Mode, Effect, S (1-10), O (1-10), D (1-10), RPN, Mitigation
- Critical items (RPN>=200 or S>=9) flagged with mitigation + verification
- Assumptions and limitations stated
