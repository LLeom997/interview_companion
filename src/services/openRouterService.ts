import { buildDefaultSystemPrompt, buildDeepDiveSystemPrompt } from './systemPrompts';

export interface ExtraInfoDoc {
  id: string;
  header: string;
  information: string;
}

export interface CopilotContext {
  resume: string;
  companyInfo: string;
  jobDescription: string;
  targetRole: string;
  extraInfo: string | ExtraInfoDoc[];
  whirlpoolDocument?: string;
}

export interface CopilotResponse {
  answer: string;
}

export const DEFAULT_WHIRLPOOL_DOCUMENT = `WHIRLPOOL CORPORATION WORK EXPERIENCE & PROJECTS

Professional Summary
Mechanical/Product Development Engineer with experience across advanced development, chassis engineering, packaging optimization, CAE simulation, thermal systems, validation engineering, VAVE, sustaining engineering, and regulatory compliance within cooking and refrigeration platforms at entity["company","Whirlpool Corporation","American multinational home appliance manufacturer"].
Demonstrated expertise in simulation-driven product development, cross-functional systems integration, cost optimization, and digital engineering workflows involving CFD, FEA, thermal validation, CG analysis automation, and AI-assisted field analytics. Led and supported multiple global engineering initiatives spanning packaging reliability, architecture integration, serviceability optimization, transit-damage analytics, and product robustness improvements.
Key contributions include:
~$27M field-damage exposure quantification through sensor-driven transit analytics
~$3M packaging cost savings through packaging commonization strategy
~$600K annual VAVE savings across multiple engineering initiatives
27% SKU complexity reduction across 48-product regulatory compliance program
70% reduction in CG analysis turnaround time through Creo-based automation workflow
40% reduction in empirical reruns using CAE-driven validation methodologies
Technical strengths include:
Chassis & Packaging Engineering
Thermal/CFD Validation
FEA & Hyperelastic Material Modeling
DFMEA & Requirements Traceability
Virtual Validation & Rapid Prototyping
Sustaining Engineering & Reliability Analytics
Product Architecture Integration
CAD Development (Creo, SolidWorks)
Power BI, Python, VBA & AI-Assisted Engineering Analytics
VAVE, Cost Optimization & Competitive Benchmarking
Strong exposure to systems-level engineering execution involving stakeholder management, engineering governance, risk mitigation, cross-functional collaboration, and advanced product-development workflows from concept feasibility through validation and sustaining engineering.
1. TNT Wave 1 / Wave 2 / Wave 3 — Packaging Engineering & Cost Optimization
Project Overview
Worked on multiple TNT (Targeted New Technology) packaging initiatives focused on packaging optimization, validation, and cost avoidance for appliance platforms at Whirlpool Corporation.
Key Responsibilities
Executed packaging development activities across TNT Wave 1, Wave 2, and Wave 3 programs.
Conducted packaging validation and performance testing for transportation and handling reliability.
Worked on packaging optimization to reduce material utilization while maintaining structural integrity and product protection.
Coordinated with testing, manufacturing, supplier, and quality teams for implementation feasibility.
Engineering Activities
Packaging concept evaluation
Transit validation testing
Cushioning and impact protection analysis
Material optimization studies
Packaging reliability assessment
Cost reduction and VAVE initiatives
Major Cost Optimization Case Study — TNT Wave 2 Packaging Commonization
Business Context
TNT Wave 2 involved refresh and relaunch activities for existing production appliance platforms. Initial plans proposed implementation of new/commonized packaging architecture aligned with TNT Wave 1 programs to support manufacturing line commonization.
Engineering & Business Challenge
Existing current-production packaging was scheduled for phase-out.
Proposed TNT Wave 1 commonized packaging solution required additional implementation cost.
Opportunity identified to evaluate compatibility of existing production packaging with refreshed TNT Wave 2 product architecture.
Packaging compatibility with refreshed product was approximately 75%, requiring engineering modifications to remaining critical interfaces.
Engineering Approach
Developed business case comparing current-production packaging versus new commonized packaging.
Performed virtual validation and empirical testing to assess compatibility and structural performance.
Modified approximately 25% of critical packaging interfaces/components to achieve required fitment and protection requirements.
Front-loaded validation activities to reduce program risk and implementation delays.
Digital Validation Innovation
Developed one of the first standardized virtual validation workflows within Whirlpool packaging engineering for rapid Center of Gravity (CG) evaluation.
Created a standardized operating procedure (SOP) in Creo for CG calculation at product and full-assembly level.
Developed automated Mapkey-based workflow enabling rapid material assignment and CG analysis across multiple product configurations.
Significantly reduced dependency on conventional manual CG evaluation methodologies.
Reduced CG analysis time by approximately 70% compared to traditional workflow.
Improved repeatability and standardization of virtual packaging validation activities across programs.
Leveraged and scaled the CG analysis methodology developed during TNT Wave 2 into multiple Whirlpool cooking-platform projects.
Conducted cross-functional knowledge transfer sessions for engineering teams on full-product and assembly-level CG calculation methodologies.
Established reusable engineering practices enabling faster adoption of virtual validation workflows across programs.
Contributed to standardization of digital packaging validation processes within the cooking product category.
Validation Activities
Conducted comprehensive Whirlpool packaging validation framework including:
Flat drop testing
Front drop testing
Inclined impact testing
Transit reliability assessment
Physical stack testing
Validation Constraints
Stack testing required physical validation due to simulation material data limitations.
Limited material characterization prevented complete digital simulation for long-duration static stack loading.
Combined empirical and virtual validation methodologies were used for final approval.
Technical & Business Impact
Accelerated architecture feasibility assessment through simulation-driven CG validation.
Reduced physical validation reiterations and stack-testing dependency using virtual confidence methodology.
Improved engineering turnaround time for stability analysis during advanced development activities.
Successfully resolved airflow-performance roadblocks using CFD-driven optimization.
Achieved approximately $3M cost savings through reuse and adaptation of existing production packaging.
Eliminated unnecessary packaging redesign and manufacturing conversion costs.
Supported production-line commonization objectives while minimizing capital and tooling impact.
Reduced program implementation complexity through strategic packaging reuse.
Technical Contribution
Delivered approximately $600K in cost avoidance savings through packaging optimization and validation-driven engineering decisions without compromising packaging performance or product safety.
Stakeholder & Program Management Approach
Practiced proactive communication before escalation with cross-functional stakeholders.
Shared structured cause-action-revised timeline updates during project execution.
Avoided over-commitment and maintained realistic execution schedules.
Applied task-action-evidence communication framework for engineering reviews and stakeholder alignment.
Front-loaded validation and risk mitigation activities to minimize downstream delays.
Technical Keywords
Packaging Validation • Transit Testing • Cost Avoidance • VAVE • Packaging Optimization • Reliability Engineering • DFM • Manufacturing Coordination • Material Optimization • Product Protection Engineering
Interview Explanation
"I worked on TNT Wave 1, Wave 2, and Wave 3 packaging programs where my primary responsibility was packaging optimization and validation for appliance platforms. The focus was to reduce packaging cost while ensuring transportation reliability and structural integrity. I worked closely with testing and manufacturing teams to validate packaging performance through transit and handling studies. Through validation-driven optimization and material reduction initiatives, we achieved approximately $600K in cost avoidance savings without impacting product safety or packaging reliability."
Resume-Ready Version
Executed packaging development and validation activities across TNT Wave 1, 2, and 3 appliance programs, delivering ~$600K in cost avoidance through packaging optimization and validation-led engineering improvements.
Performed packaging reliability assessments, transportation validation, and material optimization studies in coordination with cross-functional manufacturing and quality teams.

2. AI Oven Camera Thermal Duct Development — Chassis & Thermal Engineering
Project Overview
Worked on the development of a thermal airflow duct system for an AI-enabled in-oven camera module designed to capture food images and communicate with the electronic control system.
Problem Statement
The camera module operated in a high-temperature oven environment requiring controlled airflow and thermal isolation to maintain functional operating temperatures and ensure imaging reliability.
Key Responsibilities
Owned the thermal duct development from chassis and thermal integration standpoint.
Designed airflow routing architecture within a predefined package/claim space.
Developed optimized duct pathways for efficient airflow management and thermal protection of the AI camera assembly.
Engineering Targets & Constraints
Thermal target was to maintain camera operating temperature below 65°C, including during pyro-cleaning cycles.
Camera module required thermal protection within an extremely high-temperature oven environment.
Material selection tradeoff between thermal performance, shrinkage, manufacturability, and cost.
Material Engineering Considerations
Evaluated ABS, PBT, and Polypropylene (PP) materials for duct application.
ABS selected as baseline candidate due to:
Better dimensional stability
Lower shrinkage characteristics
Improved heat deflection performance compared to polypropylene
Better cosmetic stability for consumer-visible components
Polypropylene offered lower cost advantages but presented higher shrinkage and lower thermal resistance.
Food-grade material compliance was not required since the component had no direct food-contact interface.
Primary material selection criteria focused on:
Heat deflection temperature (HDT)
Thermal stability
Dimensional control
Manufacturability
Cost optimization
Engineering Challenges
Extremely constrained package/claim space
Thermal exposure from oven cavity
Airflow efficiency vs manufacturability tradeoff
Integration with chassis architecture and electronic systems
Maintaining camera operational stability under thermal loading
Engineering Approach
Generated and evaluated approximately 9 different airflow duct concepts.
Down-selected top 3 concepts using:
Virtual validation
Airflow and thermal performance studies
Design feasibility analysis
Prototype testing
Finalized optimized concept through iterative validation cycles.
CAE & Validation Impact
Thermal CAE and virtual validation activities eliminated approximately 40% of empirical reruns during development.
Front-loaded digital validation activities into project schedule to reduce prototype iteration cycles and improve development efficiency.
Utilized simulation-driven concept refinement prior to physical validation.
Validation & Prototyping
SLA and SLS 3D printing used for rapid prototyping.
Conducted prototype fitment and airflow evaluation studies.
Supported virtual and physical design validation activities.
Technical Keywords
Thermal Management • Airflow Optimization • Chassis Packaging • Thermal CAE • CFD Validation • Design Validation • Rapid Prototyping • SLA/SLS Additive Manufacturing • Concept Down-selection • DFM • System Integration • Thermal Protection Architecture • Heat Deflection Analysis • Material Selection Engineering • Risk Mitigation • Program Execution
Interview Explanation
"I worked on the thermal duct development for an AI-enabled oven camera system. The challenge was to protect the camera module in a high-temperature oven environment while working within a highly constrained package space. I was responsible for developing the airflow routing architecture and optimizing the duct path for thermal protection and airflow efficiency. We created around nine different concepts and performed concept down-selection using virtual validation, thermal studies, and prototyping. We used SLA and SLS 3D printing for rapid prototype evaluation before finalizing the production-feasible design."
Resume-Ready Version
Led chassis and thermal integration development for an AI-enabled oven camera system by designing optimized thermal airflow duct architecture within constrained package space.
Developed and evaluated 9 thermal duct concepts, performing virtual validation, airflow studies, and rapid prototyping using SLA/SLS 3D printing before finalizing production-feasible design.
Executed concept down-selection through thermal performance evaluation, chassis integration studies, and design validation activities.

3. CHAPLIN — Latin America Bulk Cooktop Platform Refurbishment
Project Overview
Worked on the CHAPLIN cooktop platform program for Latin American markets, supporting refurbishment and refresh activities for bulk production cooking products. Responsible for chassis and packaging subsystems.
Business Context
The project primarily focused on cosmetic and feature refresh activities including knob and grate updates for existing cooktop platforms. Initial scope involved minimal chassis redevelopment.
Critical Quality Issue Identification
During program execution, a high-severity GSIR (Global Supplier/Internal Reliability) issue was identified related to manifold damage during product transit.
Engineering Challenge
Manifold tube was exposed to transit-induced impact loading.
Damage occurrence rate was relatively low but carried high severity and customer-impact risk.
Existing issue remained partially hidden within historical GSIR data due to lower occurrence percentage.
Required corrective action without major platform redesign.
Engineering Approach
Performed chassis architecture review focused on manifold protection strategy.
Redesigned chassis geometry to encapsulate the manifold within the cavity envelope.
Reduced exposed manifold tube length to approximately 14 mm.
Achieved approximately 30 mm additional bottom clearance/protection zone for transit conditions.
Program Constraints & KPI
Primary program KPI was to avoid any incremental BOM cost or tooling investment.
Chassis budget allocation was extremely constrained due to refurbishment-focused project scope.
Solution required implementation using existing manufacturing ecosystem and minimal structural modification.
Virtual Validation & Packaging Optimization Impact
Leveraged virtual validation methodologies to reduce physical reruns by approximately 30% during CHAPLIN development activities.
Front-loaded simulation and digital validation activities to minimize empirical iteration cycles.
Reused and optimized existing packaging architecture to avoid unnecessary redevelopment.
Achieved approximately $300K packaging-related cost savings through strategic packaging reuse and validation-driven optimization.
Cost optimization initiative originated from internally submitted engineering improvement idea and was later implemented during project execution.
Technical Outcome
Significantly reduced manifold exposure to transit impact conditions.
Eliminated direct impact interaction causing manifold deformation/damage.
Improved transportation robustness and field reliability of cooktop platform.
Resolved high-severity transit-related GSIR concern through targeted chassis modification rather than full-system redesign.
Avoided new tooling investment while achieving required reliability improvements.
Delivered approximately 7% BOM cost reduction across combined chassis and surface subsystem architecture.
Achieved reliability enhancement and cost optimization simultaneously within constrained refurbishment program budget.
Engineering Significance
Demonstrated ownership by converting internally proposed engineering ideas into implemented business-impact solutions.
Combined reliability improvement, packaging optimization, and cost reduction within a constrained refurbishment platform.
Successfully integrated virtual validation into refurbishment-focused development workflow.
Demonstrated proactive issue identification beyond planned project scope.
Converted latent field-quality issue into validated design improvement opportunity.
Balanced minimal design intervention with maximum reliability impact.
Applied DFM and reliability-focused chassis redesign principles.
Technical Keywords
Chassis Engineering • Reliability Improvement • GSIR Resolution • Transit Damage Mitigation • Structural Packaging • Design Refresh • Root Cause Mitigation • Product Reliability • Transportation Robustness • Corrective Design Action • DFM • Cooktop Platform Engineering
Interview Explanation
"The CHAPLIN project was primarily a refurbishment program for Latin American bulk cooktop platforms where we were updating external components like knobs and grates. Initially, there was limited chassis scope, but during execution we identified a high-severity GSIR issue related to manifold damage during transit. Although occurrence percentage was low, the severity was critical. I worked on redesigning the chassis architecture so that the manifold became encapsulated inside the cavity, leaving only about 14 mm of tube exposed. This created nearly 30 mm additional protection clearance at the bottom and eliminated direct transit impact on the manifold, significantly improving transportation robustness and field reliability."
Resume-Ready Version
Led chassis-level corrective design action for Latin American CHAPLIN cooktop platform by resolving high-severity transit-induced manifold damage issue through targeted structural redesign.
Redesigned chassis architecture to encapsulate manifold assembly and increase impact clearance by ~30 mm, significantly improving transportation robustness and reducing field-quality risk.
Identified and resolved latent GSIR reliability issue outside original refurbishment scope through validation-driven chassis optimization.

4. Cross-Functional Engineering Governance, DFMEA & Requirements Management
Functional Ownership
Across all TNT Wave and CHAPLIN programs, owned and supported engineering governance activities associated with DFMEA, requirements traceability, validation planning, and cross-functional engineering coordination.
DFMEA Collaboration & Workshop Contributions
Supported multiple DFMEA review sessions and engineering-risk workshops across cooking-platform programs.
Participated in collaborative suggestion and mitigation discussions with cross-functional engineering teams.
Contributed toward identification of failure modes, risk-priority assessment, and mitigation strategy development.
Assisted teams in improving DFMEA quality, documentation completeness, and validation alignment through structured review sessions.
DFMEA & Risk Management Responsibilities
Responsible for DFMEA creation, updates, and closure activities across packaging and chassis subsystems.
Conducted structured DFMEA reviews with senior leadership, technical approvers, and cross-functional stakeholders.
Collaborated with engineering mentors/buddies and technical approvers to align risk mitigation actions and validation requirements.
Applied structured risk-assessment methodologies for failure prevention and design robustness improvement.
Requirements Management & Traceability
Managed and RTVM-related requirement traceability activities.
Traced product and subsystem requirements from DBPNR inputs through validation and implementation stages.
Maintained requirement alignment between design intent, validation activities, and program deliverables.
Supported structured documentation and engineering change coordination activities.
Program Execution & Cross-Functional Coordination
Utilized RACI framework for stakeholder ownership clarification and execution tracking.
Coordinated with packaging, chassis, validation, manufacturing, quality, and leadership teams for project execution.
Supported process optimization, cost reduction initiatives, and validation governance activities across programs.
Ensured alignment between technical deliverables, timelines, and business objectives.
Engineering Significance
Demonstrated systems-level engineering ownership beyond CAD and validation execution.
Combined technical engineering activities with structured program governance and documentation control.
Improved cross-functional execution transparency through requirement traceability and risk-management practices.
Technical Keywords
DFMEA • RTVM • Requirements Traceability • DVP&R • Risk Mitigation • Engineering Governance • RACI Framework • Cross-Functional Coordination • Validation Planning • Design Risk Assessment • Engineering Documentation • Program Execution • Product Development Lifecycle
Interview Explanation
"Apart from technical development activities, I was also responsible for DFMEA and requirements management activities across multiple programs. I coordinated DFMEA reviews with senior leadership, technical approvers, and cross-functional teams to ensure design risks and mitigation plans were properly addressed. I also handled RTVM traceability activities and mapped requirements from DBPNR through validation and implementation stages. Along with technical execution, I supported process optimization, cost savings initiatives, and structured stakeholder coordination using RACI-based ownership tracking."
Resume-Ready Version
Owned DFMEA documentation, risk mitigation reviews, and requirements traceability activities across packaging and chassis development programs.
Managed RTVM traceability and DBPNR requirement alignment through validation and implementation lifecycle.
Coordinated cross-functional engineering reviews with leadership, technical approvers, validation, manufacturing, and quality teams using structured RACI-based execution framework.

5. VAVE (Value Analysis / Value Engineering) Initiatives
Project Overview
Led and supported multiple VAVE initiatives focused on cost optimization, material reduction, packaging efficiency, subsystem simplification, and manufacturing feasibility improvements across Whirlpool cooking platforms.
Scope & Ownership
Led approximately 7 different VAVE projects across packaging and chassis-related subsystems.
Identified cost-reduction opportunities through design optimization, packaging reuse, commonization, and validation-driven engineering improvements.
Worked closely with manufacturing, sourcing, validation, and quality teams to ensure cost reduction initiatives maintained product reliability and manufacturability.
Engineering Approach
Applied simulation-first and validation-driven methodology to reduce redesign iterations.
Performed business-case analysis for implementation feasibility and ROI justification.
Evaluated subsystem-level optimization opportunities without impacting product functionality, reliability, or customer experience.
Leveraged existing production architecture wherever feasible to minimize tooling and implementation cost.
Technical & Business Impact
Delivered approximately $600K in annualized cost savings through VAVE initiatives.
Successfully balanced cost optimization with quality, reliability, and manufacturing constraints.
Reduced unnecessary tooling and redevelopment activities through strategic reuse and commonization approaches.
Contributed to process optimization and improved engineering efficiency across programs.
Engineering Significance
Demonstrated strong cost-engineering and value-optimization mindset.
Combined technical feasibility with business-impact decision making.
Applied cross-functional collaboration to convert engineering opportunities into implemented savings.
Technical Keywords
VAVE • Cost Optimization • BOM Reduction • Commonization • Packaging Optimization • Manufacturing Feasibility • Cost Avoidance • DFM • Process Optimization • Engineering Economics • Validation-Driven Development • Product Cost Engineering
Interview Explanation
"From a VAVE standpoint, I led around seven different projects focused on cost optimization and engineering efficiency improvements. These projects involved packaging optimization, subsystem commonization, validation-driven redesign, and leveraging existing production architecture to avoid unnecessary tooling or redevelopment costs. Through these initiatives, we achieved approximately $600K in annualized cost savings while maintaining product reliability and manufacturing feasibility."
Resume-Ready Version
Led 7 VAVE initiatives across cooking-platform packaging and chassis subsystems, delivering approximately $600K in annualized cost savings.
Drove cost optimization through packaging commonization, subsystem redesign, validation-led engineering improvements, and manufacturing-focused implementation strategies.
Collaborated cross-functionally with sourcing, manufacturing, validation, and quality teams to implement cost-reduction initiatives without compromising reliability or product performance.

6. Q-Plus Downdraft — Advanced Development Architecture Integration Program
Project Overview
Worked on the Q-Plus Downdraft advanced development program focused on integrating downdraft ventilation architecture from VSI/Vesta platform into the existing Q-Plus freestanding range architecture.
Business & Technical Context
Q-Plus platform had been in production for approximately five years across earlier program phases.
Q-Plus Downdraft was initiated as part of advanced development activities under Phase 2 roadmap.
Objective was to evaluate feasibility of integrating two independent cooking architectures into a single production-feasible platform.
Program targeted future PDP entry planned for January 2027 with SOP roadmap aligned for 2028 production launch.
Functional Ownership
Responsible for chassis and packaging subsystems.
Owned downdraft duct integration architecture within constrained claim/package space.
Supported integration feasibility, prototype development, validation planning, and advanced development execution.
System Engineering Challenge
Integrated downdraft assembly from VSI/Vesta architecture into existing Q-Plus platform.
Downdraft system required airflow extraction capability of approximately 130 CFM.
Airflow needed to be routed from cooktop surface through internal duct path and exhausted externally through wall-integrated ducting.
Existing claim space constraints created airflow and packaging conflicts.
Initial architecture introduced approximately 8% airflow performance penalty relative to target requirements.
Engineering Approach
Developed optimized duct-routing architecture within constrained package space.
Utilized CFD, thermal analysis, and virtual validation methodologies to optimize airflow performance.
Applied RTVM requirements-driven development framework to ensure compliance with system-level performance requirements.
Executed iterative design-validation loops to eliminate airflow restrictions and packaging conflicts.
Supported integration of two independent subsystem architectures into unified chassis environment.
Thermal & Virtual Validation Methodology
Utilized WFE (Wall-Floor-Enclosure) validation framework for thermal and airflow analysis.
Simulated real-world freestanding range installation conditions where:
Product positioned adjacent to walls
Installed above floor boundary conditions
Limited atmospheric exposure across product surfaces
Thermal analysis replicated realistic kitchen installation constraints impacting airflow and thermal behavior.
Leveraged virtual validation to identify and mitigate integration risks prior to extensive physical prototyping.
CG Analysis & Stability Validation Innovation
Leveraged previously developed CG analysis methodology to evaluate center-of-gravity shift resulting from downdraft system integration.
Conducted comparative CG analysis across:
Original Q-Plus architecture
VSI downdraft architecture
Integrated Q-Plus Downdraft configuration
Established a simulation-driven “Circle of Confidence” methodology to validate whether integrated architecture CG behavior remained within acceptable stability boundaries derived from validated legacy platforms.
Used Creo-based CG evaluation workflow to rapidly assess product-level mass distribution and stability impacts.
Delivered CG assessment results within approximately one week, significantly accelerating engineering decision-making.
Reduced dependency on repeated physical stack-testing iterations through virtual validation confidence-building.
Demonstrated that integrated Q-Plus Downdraft architecture remained within acceptable CG envelope based on benchmarked legacy systems.
Prototype & Validation Execution
Delivered advanced development prototype builds for system-level feasibility assessment.
Completed primary validation using two physical prototype models.
Captured lessons learned, risk mitigation actions, and architectural integration findings for PDP transition readiness.
Maintained structured risk registers and technical documentation throughout project lifecycle.
Technical & Business Impact
Successfully resolved airflow-performance roadblocks using CFD-driven optimization.
Demonstrated feasibility of integrating downdraft ventilation into existing Q-Plus architecture.
Reduced technical uncertainty ahead of formal PDP transition.
Established technical foundation for future production-intent downdraft cooking platform.
Contributed to milestone advanced-development initiative within Whirlpool cooking platform roadmap.
Engineering Significance
Demonstrated systems-level architecture integration capability.
Combined thermal, airflow, packaging, and chassis engineering into unified product-development activity.
Applied advanced virtual validation methodologies to accelerate feasibility development.
Successfully managed complex multi-architecture integration under constrained package conditions.
Technical Keywords
Advanced Development • System Architecture Integration • Downdraft Ventilation • CFD Analysis • Thermal Validation • Airflow Optimization • Chassis Packaging • Claim Space Optimization • Requirements Traceability • RTVM • Risk Register Management • Prototype Validation • Product Feasibility • Cooking Platform Engineering • DFM • System Integration
Interview Explanation
"I worked on the Q-Plus Downdraft advanced development program where the objective was to integrate a downdraft ventilation system from the VSI/Vesta platform into the existing Q-Plus cooking architecture. I was responsible for chassis and packaging integration, particularly the duct-routing architecture within a constrained claim space. The system required approximately 130 CFM airflow performance, but initially we observed nearly an 8% airflow penalty due to packaging constraints. Using CFD, thermal validation, and virtual simulation methodologies, we optimized the airflow path and resolved the integration issues. We used a WFE validation framework to simulate real-world kitchen installation conditions and completed primary validation using physical prototypes. The project was delivered as an advanced development milestone with lessons learned and risk mitigation documentation for future PDP transition."
Resume-Ready Version
Led chassis and packaging integration activities for Q-Plus Downdraft advanced development program involving integration of VSI/Vesta downdraft architecture into existing Q-Plus cooking platform.
Optimized 130 CFM downdraft airflow system within constrained claim space using CFD, thermal validation, and simulation-driven design refinement.
Resolved ~8% airflow performance penalty through virtual validation and duct-routing optimization during multi-architecture integration.
Supported advanced development prototype builds, WFE-based thermal validation, and risk-mitigation documentation for planned PDP transition and future SOP readiness.

7. Total Cost of Damage (TCD) — Sensor-Based Transit Damage Analytics & Sustaining Engineering Prioritization
Project Overview
Worked on a global cooking-platform initiative focused on quantifying field transit damage and reducing product-return-related costs through sensor-driven impact analytics, data engineering, and sustaining-engineering prioritization.
Business Problem
Analysis using TCD (Total Cost of Damage) dashboard, SAS VA datasets, and GSIR systems identified approximately $27M in field-damage exposure associated with product returns and transit-related failures.
Existing field-failure understanding lacked granular visibility into exact transportation conditions and high-impact transit zones.
Objective was to convert fragmented field-quality data into actionable engineering intelligence for packaging and product robustness improvements.
Engineering & Analytics Approach
Proposed and initiated sensor-based transit monitoring methodology across North American logistics routes.
Focused on products traveling across East Coast, West Coast, and Canadian distribution routes.
Instrumented approximately 30 product units using accelerometers and impact sensors.
Enabled continuous tracking of shock/load events throughout transportation lifecycle.
Captured high-G transient impact events generated from potholes, handling conditions, and transportation disturbances.
Data Intelligence & Root Cause Quantification
Correlated field-damage trends with transportation-event data to identify high-risk transit regions and recurring logistics patterns.
Used sensor telemetry to identify locations contributing maximum impact severity.
Established framework for identifying repeatable damage patterns across transportation corridors.
Enabled engineering teams to distinguish between field-condition limitations and product robustness limitations.
Engineering Objective
If transportation conditions could not be controlled, the strategy was to improve product structural robustness and packaging resilience.
Data-driven insights supported prioritization of sustaining-engineering activities for packaging and structural improvements.
Program focused on reducing voluntary warranty and return-related damage costs.
Digital Infrastructure & Workflow Automation
Developed Python- and VBA-based workflows for extracting and processing sensor-vendor API data.
Created automated engineering-data pipelines for sensor telemetry ingestion and analysis.
Utilized LLM-based workflows using GPT-4o Mini and OpenRouter-hosted models for converting raw sensor measurements into engineering insights and prioritized action items.
AI-assisted workflows supported engineering interpretation rather than autonomous decision-making.
Visualization & Leadership Reporting
Developed Power BI dashboards for engineering and leadership visibility.
Dashboard tracked:
Product impact severity
Route-based damage trends
Sensor-event analytics
Field-risk KPIs
Program status updates
Hosted recurring global review meetings with leadership teams to communicate weekly findings and engineering priorities.
Technical & Business Impact
Quantified approximately $27M worth of field-damage exposure using integrated field-quality analytics.
Improved engineering turnaround time by approximately 23% through automated dashboards and AI-assisted analytics workflows.
Enabled data-driven sustaining-engineering prioritization for packaging and structural robustness improvements.
Established foundation for predictive transit-damage analysis and future reliability optimization initiatives.
Improved organizational visibility into transportation-driven product damage mechanisms.
Engineering Significance
Combined mechanical engineering, field-quality analytics, IoT sensor integration, and AI-assisted engineering workflows.
Demonstrated systems-level approach toward reliability engineering and sustaining-product optimization.
Integrated data engineering, dashboarding, and physical-product validation into unified engineering decision-making framework.
Showcased emerging digital-engineering and AI-assisted product-development capability within manufacturing environment.
Technical Keywords
Reliability Engineering • Sustaining Engineering • Total Cost of Damage (TCD) • Field Failure Analytics • Accelerometer Integration • Sensor Telemetry • Transit Damage Analysis • Data Engineering • Python Automation • VBA Automation • Power BI • AI-Assisted Analytics • GSIR • SAS VA • IoT-Based Validation • Transportation Reliability • Product Robustness • Root Cause Quantification • Engineering Intelligence
Interview Explanation
"I worked on a global Total Cost of Damage project focused on quantifying transit-related field damage across cooking platforms. Using TCD dashboards, GSIR data, and SAS VA analytics, we identified nearly $27M worth of field-damage exposure linked to product returns. To understand the root causes, we instrumented around 30 products with accelerometers and tracked transportation events across North American logistics routes. The objective was to identify high-impact locations and recurring transportation patterns causing product damage. We developed Python- and VBA-based workflows to ingest sensor-vendor API data and used AI-assisted analytics workflows to convert raw telemetry into engineering insights and sustaining-engineering priorities. Power BI dashboards improved leadership visibility and reduced engineering turnaround time by approximately 23%."
Resume-Ready Version
Led sensor-driven transit damage analytics initiative quantifying ~$27M in field-damage exposure using TCD dashboards, GSIR data, and accelerometer-based transportation monitoring.
Developed Python/VBA-based telemetry workflows and Power BI dashboards for sensor-data analytics, sustaining-engineering prioritization, and leadership reporting.
Instrumented 30+ product units with accelerometers to identify high-impact logistics routes and transportation-driven product damage mechanisms.
Leveraged AI-assisted analytics workflows using LLMs to convert raw sensor telemetry into engineering insights, improving engineering turnaround efficiency by ~23%.

8. Refrigeration Platform CAE Development — Early Career FEA & Material Modeling
Project Overview
Started career at Whirlpool Corporation as a CAE Engineer supporting refrigeration-platform chassis development through finite-element analysis (FEA), simulation-driven design decisions, and material-model development.
Functional Ownership
Executed structural finite-element simulations using ANSYS for refrigeration-platform chassis systems.
Supported early-stage virtual validation and simulation-driven engineering decisions.
Contributed to value-engineering and cost-optimization initiatives through CAE-based assessment methodologies.
Worked on simulation-to-test correlation activities for improved model reliability.
Engineering Activities
Structural FEA for chassis and subsystem components.
Stress and deformation analysis under operational loading conditions.
Simulation-driven design optimization and feasibility studies.
Early-stage virtual validation for design decision acceleration.
Engineering support for value-analysis and material optimization activities.
Hyperelastic Material Model Development
Developed hyperelastic material models for silicone-rubber applications using nonlinear constitutive modeling approaches.
Evaluated and calibrated multiple hyperelastic models including:
Mooney-Rivlin
Ogden
Other nonlinear elastomeric material formulations
Performed simulation-to-test correlation activities for improving material-model accuracy and predictive capability.
Achieved approximately 80% correlation between simulation and physical application behavior.
Supported calibration and validation of nonlinear material behavior within CAE environment.
Improved prediction capability for elastomeric component performance under loading conditions.
Engineering Significance
Built strong foundation in simulation-driven product development.
Developed understanding of correlation between physical testing and virtual validation.
Applied CAE methodologies to support engineering decision-making during early product-development stages.
Strengthened systems-level understanding of structural behavior and material-response characteristics.
Technical Keywords
FEA • ANSYS • Structural Simulation • CAE • Hyperelastic Material Modeling • Silicone Rubber Modeling • Simulation-to-Test Correlation • Nonlinear Analysis • Structural Validation • Virtual Engineering • Design Optimization • Value Engineering • Refrigeration Platform Engineering
Interview Explanation
"I initially joined Whirlpool as a CAE Engineer supporting refrigeration-platform development activities. My responsibilities included executing structural FEA simulations in ANSYS for chassis-related components and supporting early-stage virtual engineering decisions. I also worked on developing a hyperelastic material model for silicone rubber applications, where we performed simulation-to-test correlation to improve the accuracy of nonlinear material behavior prediction. This role helped me build a strong foundation in simulation-driven product development and virtual validation methodologies."
Resume-Ready Version
Executed structural FEA and virtual validation activities using ANSYS for refrigeration-platform chassis systems and early-stage product-development decisions.
Developed hyperelastic silicone-rubber material models with simulation-to-test correlation for improved nonlinear material-behavior prediction.
Supported CAE-driven value engineering, structural optimization, and simulation-based design validation activities.

9. URSO — Canadian Regulatory Compliance & Serviceability Optimization Program
Project Overview
Worked on the URSO program focused on enabling regulatory-compliant freestanding-range product launches for Canadian markets through serviceability-focused design optimization across 48 product SKUs.
Business & Regulatory Context
Program objective was to expand and sustain product sales within Canadian market.
Existing freestanding-range platforms were non-compliant with Canadian serviceability regulations.
Regulatory requirement mandated service access to heating element/heating coil within 10 minutes.
Existing product architecture required approximately 32 minutes for service access and coil exposure.
Non-compliance resulted in PEXO (Product Exchange) issues, requiring full product replacement instead of service repair.
Engineering Complexity
Managed engineering analysis across 48 different SKUs.
Product complexity driven by:
Multiple platform widths:
30-inch
36-inch
48-inch
Multiple fuel architectures:
Gas
Electric
Dual Fuel
Dual-fuel configurations introduced additional subsystem and serviceability dependencies.
Any design modification required full cross-impact analysis across SKU variants and shared BOM structures.
Functional Ownership
Responsible for BOM mapping and configuration traceability across all affected SKUs.
Performed cross-platform impact assessment for regulatory-driven design modifications.
Evaluated subsystem interactions and serviceability implications resulting from design changes.
Coordinated requirement implementation while minimizing downstream SKU disruption.
Engineering Approach
Conducted detailed BOM-level traceability and configuration analysis.
Identified component-level dependencies across shared architectures.
Evaluated service-access pathways and disassembly sequences.
Optimized design architecture to reduce service-access time while maintaining platform compatibility.
Applied structured change-management and configuration-control methodologies.
Technical & Business Impact
Reduced regulatory compliance risk for Canadian-market product portfolio.
Enabled serviceability-driven design improvements across multiple product configurations.
Delivered engineering solution within approximately 3 months despite high SKU complexity.
Reduced PEXO-related product exchange exposure by improving repair accessibility.
Improved maintainability and field-service efficiency for freestanding-range platforms.
Reduced SKU-management and configuration complexity by approximately 27% through structured traceability and architecture-analysis methodologies.
Identified and proposed approximately $1M cost-optimization opportunity pipeline targeted for future 2027 implementation.
Conducted recurring weekly design reviews with stakeholders to maintain program transparency, alignment, and execution tracking.
Received organizational recognition through a quarterly Stellar Award for project execution and cross-functional collaboration.
Engineering Significance
Demonstrated large-scale configuration-management capability.
Combined regulatory engineering, serviceability optimization, and product-architecture analysis.
Managed complex cross-SKU dependency mapping under aggressive timeline constraints.
Applied systems-engineering mindset toward field-service and compliance optimization.
Technical Keywords
Regulatory Compliance • Serviceability Engineering • Configuration Management • BOM Traceability • PEXO Reduction • Product Architecture Analysis • Field-Service Optimization • SKU Management • Change Impact Analysis • Cross-Platform Engineering • Maintainability Engineering • Product Lifecycle Engineering • Requirements Compliance
Interview Explanation
"I worked on the URSO project, which focused on enabling freestanding-range product sales in the Canadian market by addressing regulatory serviceability requirements. The regulation required service technicians to access the heating element within 10 minutes, but existing platforms required nearly 32 minutes. The project involved managing 48 different SKUs across multiple widths and fuel configurations, including gas, electric, and dual-fuel architectures. I was responsible for BOM traceability, cross-impact analysis, and evaluating how design changes affected other SKUs. We optimized the service-access architecture and delivered the solution within approximately three months, helping reduce PEXO-related product exchange risk and improving field-serviceability compliance."
Resume-Ready Version
Led BOM traceability and cross-platform impact analysis across 48 freestanding-range SKUs for Canadian regulatory serviceability compliance program.
Supported serviceability-driven product redesign reducing heating-element access complexity for gas, electric, and dual-fuel architectures.
Delivered regulatory-compliance engineering solution within 3 months while managing multi-SKU configuration dependencies and minimizing PEXO-related product exchange risk.

10. Engineering Change Management, CAD Development & Competitive Benchmarking
Engineering Change & Release Activities
Supported multiple Engineering Change Notices (ECNs) and Change Request (CR) activities across cooking-platform programs.
Released and updated engineering drawings based on cross-functional stakeholder requirements and resource assignments.
Coordinated drawing revisions, documentation updates, and engineering-release activities within product-development lifecycle.
Supported structured change-management and configuration-control workflows.
CAD Development Responsibilities
Developed and modified CAD models using Creo and SolidWorks.
Supported subsystem modeling, assembly integration, and packaging-layout activities.
Contributed to concept-development, prototyping, and engineering-change implementation workflows.
Supported design iterations associated with validation findings and manufacturing requirements.
Digital Twin & Rapid Prototyping Exposure
Worked on digital-twin-oriented development workflows and rapid-prototyping activities.
Utilized PLA, ABS, SLA, and additive-manufacturing methodologies for prototype development and design validation.
Supported iterative engineering studies using physical prototypes and virtual-development approaches.
Contributed to accelerated concept-validation and fitment-evaluation activities.
PCMM & Manufacturing Support
Supported selected PCMM-related activities and manufacturing coordination tasks.
Assisted in subsystem-level process and manufacturability assessments.
Collaborated with cross-functional teams during engineering implementation and product-development activities.
Competitive Benchmarking & Teardown Analysis
Participated in competitive teardown and benchmarking studies for built-in oven platforms.
Conducted subsystem-level teardown analysis for competitor products including:
entity["company","Frigidaire","American home appliance brand"]
entity["company","Samsung","South Korean multinational electronics company"]
entity["company","IFB Industries","Indian home appliances company"]
Used internal cost-modeling tools to analyze subsystem architecture, manufacturing strategy, and product-cost structure.
Documented teardown findings and shared benchmark insights with engineering teams.
Cost Workshops & Ideation Activities
Hosted multiple engineering cost workshops using teardown findings and subsystem demonstrations.
Facilitated idea-generation sessions focused on VAVE opportunities, subsystem simplification, and manufacturing optimization.
Collaborated cross-functionally to identify cost-reduction and product-improvement opportunities.
Participated in intensive engineering-review and competitive-analysis sessions to support strategic product-development decisions.
Engineering Significance
Built exposure across engineering-release processes, CAD development, benchmarking, manufacturing support, and cost engineering.
Strengthened understanding of competitor product architecture and subsystem cost structure.
Developed practical exposure to engineering ideation, workshop facilitation, and teardown-driven VAVE activities.
Combined design engineering with business-oriented cost and benchmarking analysis.
Technical Keywords
Engineering Change Management • ECN • Change Request • CAD Modeling • Creo • SolidWorks • Digital Twin • Rapid Prototyping • Additive Manufacturing • Teardown Analysis • Competitive Benchmarking • Cost Modeling • VAVE Workshops • Product Architecture Analysis • Engineering Release • Configuration Control
Interview Explanation
"Apart from major development programs, I also worked on multiple engineering change notices and change-request activities involving drawing releases and configuration updates. I supported CAD development using Creo and SolidWorks and worked on rapid-prototyping workflows using PLA, ABS, and SLA-based additive manufacturing. I was also involved in teardown and competitive benchmarking activities where we analyzed built-in oven platforms from companies like Frigidaire, Samsung, and IFB using internal cost-modeling tools. Additionally, I hosted cost workshops where teardown findings and subsystem demonstrations were used to generate VAVE and product-optimization ideas."
Resume-Ready Version
Supported engineering change management activities including ECNs, change requests, drawing releases, and configuration-control workflows across cooking-platform programs.
Developed CAD models and subsystem integrations using Creo and SolidWorks while supporting rapid-prototyping and digital-twin-oriented validation activities.
Conducted competitive teardown and cost-benchmarking analysis for built-in oven platforms from Frigidaire, Samsung, and IFB using internal cost-modeling frameworks.
Facilitated teardown-based cost workshops and subsystem ideation sessions to identify VAVE and product-optimization opportunities.
`;

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const TRANSCRIBE_MODEL = "google/gemini-3.1-flash-lite";
const REASONING_MODEL = "openai/gpt-5.1-codex-mini";

// System prompt builder was moved to buildDefaultSystemPrompt in systemPrompts.ts

export async function transcribeAudio(audioBase64: string, format: string): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("VITE_OPENROUTER_API_KEY is not defined");

    const payload = {
      model: TRANSCRIBE_MODEL,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Please transcribe the provided audio word-for-word exactly as spoken. Do NOT attempt to identify speakers. Do NOT add any extra commentary or refuse the request. Just output the raw text spoken in the audio." },
          { type: "input_audio", input_audio: { data: audioBase64, format: format } },
        ],
      }],
      temperature: 0,
      stream: false,
    };

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err.slice(0, 400));
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let transcript = "";
    if (Array.isArray(content)) {
      transcript = content.map((p: any) => p.text || String(p)).join("");
    } else {
      transcript = String(content);
    }

    return transcript.trim();
  } catch (error: any) {
    console.error("Transcription error:", error);
    return `ERROR: ${error.message}`;
  }
}

export async function askReasoningModelStream(
  transcript: string,
  context: CopilotContext,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<CopilotResponse | null> {
  try {
    if (!transcript || transcript.startsWith("ERROR")) return null;

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("VITE_OPENROUTER_API_KEY is not defined");

    const systemPrompt = buildDefaultSystemPrompt(context);

    const payload = {
      model: REASONING_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `INTERVIEW QUESTION TRANSCRIPT, POSSIBLY NOISY:\n${transcript}\n\nBefore answering, silently map unclear or faulty transcript words to the closest supported terms from the resume and job description. Then answer the intended interview question only.`
        }
      ],
      temperature: 0.4,
      stream: true,
    };

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Reasoning error:", err.slice(0, 300));
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) return null;

    const decoder = new TextDecoder("utf-8");
    let answer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            const parsed = JSON.parse(line.slice(6));
            const content = parsed.choices?.[0]?.delta?.content || "";
            answer += content;
            onChunk(answer);
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }

    return { answer: answer.trim() };
  } catch (error: any) {
    console.error("Reasoning error:", error);
    return null;
  }
}

export async function askDeepDiveModelStream(
  lastQuestion: string,
  responseGenerated: string,
  jobDescription: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<CopilotResponse | null> {
  try {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("VITE_OPENROUTER_API_KEY is not defined");

    const systemPrompt = buildDeepDiveSystemPrompt(jobDescription);

    const payload = {
      model: "minimax/minimax-m2.7", // OpenAI Frontier Model
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `INTERVIEW QUESTION:\n${lastQuestion}\n\nPREVIOUS GENERATED ANSWER:\n${responseGenerated}\n\nPlease perform the Deep Dive rewrite now.`
        }
      ],
      temperature: 0.5,
      stream: true,
    };

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Deep Dive error:", err.slice(0, 300));
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) return null;

    const decoder = new TextDecoder("utf-8");
    let answer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            const parsed = JSON.parse(line.slice(6));
            const content = parsed.choices?.[0]?.delta?.content || "";
            answer += content;
            onChunk(answer);
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }

    return { answer: answer.trim() };
  } catch (error: any) {
    console.error("Deep Dive error:", error);
    return null;
  }
}
