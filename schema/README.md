# Demand Scenario CSV Schema

This folder contains the schema and template files for the Demand Scenario CSV format.

## Files

- **scenario_template.csv**: Example CSV file showing the expected format for scenario import/export

## CSV Column Definitions

### Basic Information
- `scenarioName`: Name of the scenario (string)
- `timestamp`: ISO timestamp when scenario was saved (e.g., "2025-01-15 10:30:00")

### General Parameters (Shared across all models)
- `dayType`: "weekday" or "weekend"
- `selectedDate`: FIFA game date if selected (e.g., "2026-06-14") or empty string
- `international`: International visitors percentage (0-100)
- `domestic`: Domestic visitors percentage (0-100)
- `outsideRegion`: Outside region percentage (0-100)
- `insideRegion`: Inside region percentage (0-100)
- `tdmReduction`: Background traffic reduction percentage (0-30)

### NRG Stadium Parameters
**Basic Parameters:**
- `nrg_gameStartTime`: Game start time in 24-hour format (e.g., "11:00", "13:30")
- `nrg_gameDuration`: Game duration in minutes (90, 120, or 150)
- `nrg_attendance`: NRG Stadium attendance (0-75000)
- `nrg_spectator`: NRG Spectators (0-58000)
- `nrg_fifaConstituent`: FIFA Constituent Groups (0-17000)

**Mode Share:**
- `nrg_ingressTransit`: Ingress transit percentage (0-50)
- `nrg_ingressTNC`: Ingress TNC percentage (0-30)
- `nrg_ingressWalkBike`: Ingress walk/bike percentage (0-5)
- `nrg_egressTransit`: Egress transit percentage (0-50)
- `nrg_egressTNC`: Egress TNC percentage (0-30)
- `nrg_egressWalkBike`: Egress walk/bike percentage (0-5)

Note: Auto mode share is calculated automatically as 100 - (Transit + TNC + Walk/Bike)

**Arrival/Departure Profiles (6am to 11pm - 18 hours):**
- `nrg_ingress_6` through `nrg_ingress_23`: Hourly ingress percentages (must sum to 100.0%)
- `nrg_egress_6` through `nrg_egress_23`: Hourly egress percentages (must sum to 100.0%)

### Fan Fest Parameters
**Basic Parameters:**
- `fanfest_attendance`: Fan Fest attendance (0-50000)

**Mode Share:**
- `fanfest_ingressTransit`: Ingress transit percentage (0-50)
- `fanfest_ingressTNC`: Ingress TNC percentage (0-30)
- `fanfest_ingressWalkBike`: Ingress walk/bike percentage (0-5)
- `fanfest_egressTransit`: Egress transit percentage (0-50)
- `fanfest_egressTNC`: Egress TNC percentage (0-30)
- `fanfest_egressWalkBike`: Egress walk/bike percentage (0-5)

**Arrival/Departure Profiles (6am to 11pm - 18 hours):**
- `fanfest_ingress_6` through `fanfest_ingress_23`: Hourly ingress percentages (must sum to 100.0%)
- `fanfest_egress_6` through `fanfest_egress_23`: Hourly egress percentages (must sum to 100.0%)

### Airports Parameters
**Mode Share:**
- `airports_ingressTransit`: Ingress transit percentage (0-50)
- `airports_ingressTNC`: Ingress TNC percentage (0-30)
- `airports_ingressWalkBike`: Ingress walk/bike percentage (0-5)
- `airports_egressTransit`: Egress transit percentage (0-50)
- `airports_egressTNC`: Egress TNC percentage (0-30)
- `airports_egressWalkBike`: Egress walk/bike percentage (0-5)

## Notes

- All percentage values should be integers except for ingress/egress profile values (which use one decimal place)
- The CSV must have a header row followed by data rows
- All ingress and egress profiles must each sum to 100.0%
- selectedDate can be empty if using weekday/weekend toggle instead

## Profile Column Naming Convention

Profile columns are named using the pattern: `{model}_{direction}_{hour}`

Where:
- `{model}` = "nrg", "fanfest", or "airports"
- `{direction}` = "ingress" or "egress"
- `{hour}` = Hour of day
  - For NRG and Fan Fest: 6-23 (6am to 11pm)
  - For Airports: 0-23 (midnight to 11pm)

Examples:
- `nrg_ingress_6` = NRG Stadium ingress at 6am
- `fanfest_egress_23` = Fan Fest egress at 11pm
