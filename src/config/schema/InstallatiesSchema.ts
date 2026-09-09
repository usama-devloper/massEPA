export type FieldConfig = {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date';
  options?: string[];
  optionsFn?: (values: any) => string[];
  span?: 1 | 2;
  showIf?: (values: any) => boolean;
  defaultValue?: string;
  readonly?: boolean;
};

// Helper for ventSysteemType resolution which is heavily used
const getVentSysteemType = (val: string) => {
  if (!val) return '';
  if (val.includes('Type D')) return 'D';
  if (val.includes('Type C')) return 'C';
  if (val.includes('Type A')) return 'A';
  if (val.includes('Type B')) return 'B';
  if (val.includes('Type E')) return 'E';
  return '';
};

export const InstallatiesSchema: Record<string, FieldConfig[]> = {
  Ventilatie: [
    { id: 'ventTypeToestel', label: 'SYSTEM', type: 'select', options: ['Individueel', 'Gemeenschappelijk/collectief'], defaultValue: 'Individueel', span: 1 },
    { id: 'ventIdentiekeSystemen', label: 'NUMBER OF IDENTICAL SYSTEMS', type: 'text', defaultValue: '1', span: 1 },
    { id: 'ventMerkType', label: 'BRAND & TYPE', type: 'text', defaultValue: '', span: 1 },
    { id: 'ventVentilatiesysteem', label: 'VENTILATION SYSTEM', type: 'select', options: ['Type A', 'Type B', 'Type C', 'Type D', 'Type E'], defaultValue: 'Type C', span: 1 },
    { id: 'ventSpecsBcrg', label: 'INSTALLATION YEAR', type: 'text', defaultValue: '', span: 1 },
    { id: 'ventLuchtdichtheid', label: 'AIR TIGHTNESS', type: 'select', options: ['LUKA A,B of C', 'LUKA D', 'Geen kanaal', 'Onbekend'], defaultValue: 'LUKA A,B of C', span: 1 },
    { id: 'ventSubsysteem', label: 'RIBBON HEATING', type: 'select', options: ['Ja', 'Nee'], span: 2, showIf: (v) => !!v.ventSubsysteem },
    {
      id: 'ventDemandControl',
      label: 'DEMAND CONTROL SYSTEM',
      type: 'select',
      defaultValue: '',
      span: 2,
      showIf: (v) => ['Type A', 'Type B', 'Type C', 'Type D', 'Type E'].includes(v.ventVentilatiesysteem || ''),
      optionsFn: (v) => {
        const ventSysteemType = getVentSysteemType(v.ventVentilatiesysteem);
        if (ventSysteemType === 'A') return ['A1 Standaard (toevoer niet luchtdruk gestuurd)', 'A2a Luchtdrukgestuurde toevoer delta p <= 1 Pa', 'A2b Luchtdrukgestuurde toevoer 1 Pa < delta p <= 5 Pa', 'A2c Luchtdrukgestuurde toevoer 5 Pa < delta p <= 10', 'Type onbekend, zelfregelende klep aanwezig, bouwjaar rekenzone', 'Type onbekend, zelfregelende klep aanwezig, geplaatst > 2003'];
        if (ventSysteemType === 'B') return ['B1 Standaard', 'B2 Tijdssturing op installaties, zonder zonering', 'B3 CO2-meting per verblijfsruimte, CO2-sturing op installaties, met zonering'];
        if (ventSysteemType === 'C') return ['C1 Standaard', 'C2a Luchtdrukgestuurde toevoer delta p <= 1 Pa', 'C2b Luchtdrukgestuurde toevoer 1 Pa < delta p <= 5 Pa', 'C2c Luchtdrukgestuurde toevoer 5 Pa < delta p <= 10 Pa', 'Type onbekend, zelfregelende klep aanwezig, bouwjaar rekenzone', 'Type onbekend, zelfregelende klep aanwezig, geplaatst > 2003', 'C3a Tijdsturing afvoer, zonder zonering', 'C3b Luchtdrukgestuurde toevoer delta p <= 1 PA, tijdsturing afvoer, zonder zonering', 'C3c Tijdsturing toevoer, afvoer zonder zonering', 'C4a Luchtdrukgestuurde toevoer delta p <= 1 Pa, sturing op afvoer door CO2-meting', 'C4b CO2-sturing op de toevoer in ten minste de woonkamer en de hoofdslaapkamer', 'C4c Luchtdrukgestuurde toevoer delta p <= 1 Pa, sturing op afvoer door CO2-meting', 'C5a Luchtdrukgestuurde toevoer delta p <= 1 Pa, sturing op afvoer door CO2-meting', 'C5b Luchtdrukgestuurde toevoer delta p <= 1 Pa, sturing op afvoer door CO2-meting'];
        if (ventSysteemType === 'D') return ['D1 Standaard', 'D2 Centrale WTW-installatie zonder zoneringen en zonder sturing', 'D3 Centrale WTW, sturing van afvoer CO2-meting in de WTW, geen zonering', 'D4a Tijdsturing zonder zonering', 'D4b Tijdsturing met zonering', 'D5a Centrale WTW. CO2-metingen in ten minste de woonkamer en de hoofdslaapkamer', 'D5b Decentrale WTW. CO2-metingen in ten minste de woonkamer en de hoofdslaapkamer', 'D5c Centrale WTW. CO2-metingen in ten minste de woon- en hoofdslaapkamer'];
        if (ventSysteemType === 'E') return ['E1 Systeemdeel D: decentrale WTW (Systeem D.5b)'];
        return [];
      }
    },
    { id: 'ventBypass', label: 'BYPASS PRESENT?', type: 'select', options: ['Ja, 100% bypass', 'Ja, gedeeltelijk', 'Nee'], defaultValue: 'Nee', span: 2, showIf: (v) => getVentSysteemType(v.ventVentilatiesysteem) === 'D' },
    { id: 'ventHrEfficiency', label: 'HR EFFICIENCY (%)', type: 'text', defaultValue: '', span: 1, showIf: (v) => getVentSysteemType(v.ventVentilatiesysteem) === 'D' },
    { id: 'ventVentilatoren', label: 'FANS', type: 'select', options: ['Nominaal vermogen', 'Nominaal vermogen onbekend', 'Kwaliteitsverklaring', 'Onbekend'], defaultValue: 'Nominaal vermogen', span: 2, showIf: (v) => ['Type A', 'Type B', 'Type C', 'Type D', 'Type E'].includes(v.ventVentilatiesysteem || '') },
    { id: 'ventNomPower', label: 'NOMINAL POWER (W)', type: 'text', defaultValue: '', span: 2, showIf: (v) => ['Nominaal vermogen', 'Kwaliteitsverklaring'].includes(v.ventVentilatoren || 'Nominaal vermogen') },
    { id: 'ventMotorType', label: 'MOTOR TYPE', type: 'select', options: ['Gelijkstroom', 'Wisselstroom', 'Draaistroom'], defaultValue: 'Gelijkstroom', span: 2, showIf: (v) => (v.ventVentilatoren || 'Nominaal vermogen') === 'Onbekend' },
    { id: 'ventFabrication', label: 'FABRICATION', type: 'select', options: ['tot 1980', '1980 - 1990', '1990 - 2000', '>2006'], defaultValue: '', span: 2, showIf: (v) => (v.ventVentilatoren || 'Nominaal vermogen') === 'Onbekend' }
  ],
  Verwarming: [
    { id: 'verwarmTypeToestel', label: 'SYSTEM', type: 'select', options: ['Individueel', 'Gemeenschappelijk/collectief', 'Warmtelevering derden individueel', 'Warmtelevering derden gemeenschappelijk'], defaultValue: 'Individueel', span: 1 },
    { id: 'verwarmIdentiekeSystemen', label: 'NUMBER OF IDENTICAL SYSTEMS', type: 'text', defaultValue: '1', span: 1 },
    { id: 'verwarmMerkType', label: 'BRAND & TYPE', type: 'text', defaultValue: '', span: 1 },
    { id: 'verwarmSpecsBcrg', label: 'INSTALLATION YEAR', type: 'text', defaultValue: '', span: 1 },
    {
      id: 'verwarmTypeopwekker',
      label: 'GENERATOR TYPE',
      type: 'select',
      defaultValue: 'Gasgestookte ketel',
      span: 1,
      optionsFn: (v) => {
        const isExt = (v.verwarmTypeToestel || 'Individueel').includes('derden') || (v.verwarmTypeToestel || 'Individueel').includes('afleverset');
        return isExt ? ['Warmtelevering derden'] : ['Gasgestookte ketel', 'Elektrische verwarming', 'Moederhaard', 'Lokale gaskachel', 'Lokale oliekachel', 'Oliegestookte ketel', 'WKK', 'Warmtepomp gasinjectie', 'Warmtepomp gasmotor', 'Warmtepomp elektrisch', 'Biomassakachel', 'Biomassaketel handmatig gestookt', 'Biomassaketel automatisch gestookt'];
      }
    },
    { id: 'verwarmDistributiemedium', label: 'DISTRIBUTION MEDIUM', type: 'select', options: ['Water', 'Local'], defaultValue: 'Water', span: 1, showIf: (v) => (v.verwarmTypeToestel || 'Individueel').includes('derden') || (v.verwarmTypeToestel || 'Individueel').includes('afleverset') },
    { id: 'verwarmWatertemprater', label: 'WATER FLOW TEMP', type: 'select', options: ['30/27 °C', '35/30 °C', '40/35 °C', '45/40 °C', '50/42 °C', '55/47 °C', '60/50 °C', '65/55 °C', '70/60 °C', '75/65 °C', '80/60 °C', '90/70 °C'], defaultValue: '', span: 1, showIf: (v) => ((v.verwarmTypeToestel || 'Individueel').includes('derden') || (v.verwarmTypeToestel || 'Individueel').includes('afleverset')) && (v.verwarmDistributiemedium || 'Water') === 'Water' },
    { id: 'verwarmDistributietype', label: 'DISTRIBUTION TYPE', type: 'select', options: ['Tweepijpsysteem', 'Eenpijpsysteem'], defaultValue: 'Tweepijpsysteem', span: 1, showIf: (v) => ((v.verwarmTypeToestel || 'Individueel').includes('derden') || (v.verwarmTypeToestel || 'Individueel').includes('afleverset')) && (v.verwarmDistributiemedium || 'Water') === 'Water' },
    { id: 'verwarmHrKlasse', label: 'HR CLASS', type: 'select', options: ['Onbekend', 'HR-107', 'HR-104', 'VR-ketel', 'Verbeterd rendement', 'Niet-condenserend'], defaultValue: 'Onbekend', span: 1 },
    { id: 'verwarmPower', label: 'NOMINAL POWER (kW)', type: 'text', defaultValue: '', span: 1 },
    { id: 'verwarmCode', label: 'INSTALLATION LOCATION / CODE', type: 'text', defaultValue: '', span: 1 },
    { id: 'verwarmAfgiftesysteem', label: 'DELIVERY SYSTEM', type: 'select', options: ['Radiatoren / convectoren', 'Vloer- / wandverwarming', 'Luchtverwarming', 'Stralingsverwarming', 'Overig'], defaultValue: 'Radiatoren / convectoren', span: 1, showIf: (v) => !((v.verwarmTypeToestel || 'Individueel').includes('derden') || (v.verwarmTypeToestel || 'Individueel').includes('afleverset')) },
    { id: 'verwarmRegeling', label: 'CONTROL', type: 'select', options: ['Regeling in hoofdvertrek (kamerthermostaat)', 'Centrale regeling met individuele regeling per ruimte', 'Individuele regeling per ruimte', 'Overig of onbekend'], defaultValue: 'Regeling in hoofdvertrek (kamerthermostaat)', span: 1, showIf: (v) => !((v.verwarmTypeToestel || 'Individueel').includes('derden') || (v.verwarmTypeToestel || 'Individueel').includes('afleverset')) },
    { id: 'verwarmWaterzijdigIngeeregeld', label: 'HYDRONICALLY BALANCED', type: 'select', options: ['Nee / Onbekend', 'Ja, aangetoond (Label A)', 'Ja, waarschijnlijk'], defaultValue: 'Nee / Onbekend', span: 1, showIf: (v) => !((v.verwarmTypeToestel || 'Individueel').includes('derden') || (v.verwarmTypeToestel || 'Individueel').includes('afleverset')) },
  ],
  Tapwater: [
    { id: 'tapTypeInstallatie', label: 'SYSTEM', type: 'select', options: ['Individueel', 'Gemeenschappelijk/collectief', 'Externe warmtelevering via een afleverset individueel', 'Externe warmtelevering via een afleverset gemeenschappelijk (centraal)'], defaultValue: 'Individueel', span: 1 },
    { id: 'tapIdentiekeSystemen', label: 'NUMBER OF IDENTICAL SYSTEMS', type: 'text', defaultValue: '1', span: 1 },
    { id: 'tapMerkType', label: 'BRAND & TYPE', type: 'text', defaultValue: '', span: 1 },
    {
      id: 'tapTypeOpwekker',
      label: 'GENERATOR TYPE',
      type: 'select',
      defaultValue: 'Compleet toestel',
      span: 1,
      optionsFn: (v) => {
        const isTapExternal = (v.tapTypeInstallatie || 'Individueel').includes('derden') || (v.tapTypeInstallatie || 'Individueel').includes('afleverset');
        return isTapExternal ? ['Externe warmtelevering via een afleverset'] : ['Compleet toestel', 'Direct verwarmd vat', 'Indirect verwarmd vat'];
      }
    },
    { id: 'tapTypeToestel', label: 'DEVICE TYPE', type: 'select', options: ['Keukengeiser', 'Gasgestookt warmwatertoestel (Badgeiser)', 'Gasgestookt combitoestel', '(micro) WKK', 'Elektrisch', 'Boosterwarmtepomp', 'Elektrische doorstroomverwarmer', 'Vast biobrandstoftoestel', 'Elektrische boiler', 'Warmwaterboiler'], defaultValue: 'Keukengeiser', span: 1, showIf: (v) => (v.verwarmTypeToestel || 'Individueel') === 'Individueel' },
    { id: 'tapSpecsBcrg', label: 'INSTALLATION YEAR', type: 'text', defaultValue: '', span: 1 },
    { id: 'tapAfgifteKeuken', label: 'KITCHEN DELIVERY', type: 'select', options: ['< 2 m', '2 m <= l < 4 m', '4 m <= l < 6 m', '6 m <= l < 8 m', '8 m <= l < 10 m', '10 m <= l < 12 m', '12 m <= l < 14 m', '>= 14 m'], defaultValue: '< 2 m', span: 1 },
    { id: 'tapAfgifteBadkamer', label: 'BATHROOM DELIVERY', type: 'select', options: ['< 2 m', '2 m <= l < 4 m', '4 m <= l < 6 m', '6 m <= l < 8 m', '8 m <= l < 10 m', '10 m <= l < 12 m', '12 m <= l < 14 m', '>= 14 m'], defaultValue: '< 2 m', span: 1 },
    { id: 'tapCirculatieleiding', label: 'CIRCULATION PIPE', type: 'select', options: ['Nee', 'Ja, geïsoleerd', 'Ja, ongeïsoleerd'], defaultValue: 'Nee', span: 1 },
    { id: 'tapDwtw', label: 'SHOWER HEAT RECOVERY (DWTW)', type: 'select', options: ['Nee', 'Ja, douchepijp-WTW', 'Ja, douchebak-WTW'], defaultValue: 'Nee', span: 1 },
  ],
  Koeling: [
    { id: 'koelTypeToestel', label: 'SYSTEM', type: 'select', options: ['Individueel', 'Ge/collectief', 'Koudelevering derden', 'Koudelevering derden ge'], defaultValue: 'Individueel', span: 1 },
    { id: 'koelIdentiekeSystemen', label: 'NUMBER OF IDENTICAL SYSTEMS', type: 'text', defaultValue: '1', span: 1 },
    { id: 'koelMerkType', label: 'BRAND & TYPE', type: 'text', defaultValue: '', span: 1 },
    { id: 'koelTypeInstallatie', label: 'GENERATOR TYPE', type: 'select', options: ['Compressiekoeling', 'Absorptiekoeling', 'Passieve vrije koeling'], defaultValue: 'Compressiekoeling', span: 1 },
    { id: 'koelExpansie', label: 'EXPANSIE', type: 'select', options: ['Directe koeling in de ruimte (airconditioning)', 'Directe koeling in het LBK (DX-systeem)', 'Met indirecte verdamping'], defaultValue: 'Directe koeling in de ruimte (airconditioning)', span: 1 },
    { id: 'koelDistributiemedium', label: 'DISTRIBUTIEMEDIUM', type: 'select', options: ['Water', 'Lucht', 'Koudemiddel'], defaultValue: 'Water', span: 1 },
    { id: 'koelGeneratorsCount', label: 'NUMBER OF GENERATORS', type: 'text', defaultValue: '1', span: 1 },
    { id: 'koelWatertemprater', label: 'WATER FLOW TEMP', type: 'select', options: ['6/12 °C', '12/16 °C', '12/18 °C', '17/21 °C', 'Onbekend'], defaultValue: '6/12 °C', span: 1 },
    { id: 'koelMainCirculationPump', label: 'MAIN CIRCULATION PUMP', type: 'select', options: ['Werkelijk vermogen en EI', 'Werkelijk vermogen', 'Onbekend'], defaultValue: 'Werkelijk vermogen en EI', span: 1 },
    { id: 'koelAfgiftesysteem', label: 'DELIVERY SYSTEM', type: 'select', options: ['Vloerkoeling', 'Wandkoeling', 'Plafondkoeling', 'Ventilatorconvectoren (aan plafond)', 'Ventilatorconvectoren (aan buitenmuur)', 'Overig of onbekend'], defaultValue: 'Vloerkoeling', span: 1 },
    { id: 'koelRegeling', label: 'CONTROL', type: 'select', options: ['Standalone regeling', 'Centrale regeling', 'Overig of onbekend'], defaultValue: 'Standalone regeling', span: 1 },
  ],
  'Zonne-panelen': [
    { id: 'zonTypeToestel', label: 'SYSTEM', type: 'select', options: ['Individueel', 'Gemeenschappelijk/collectief'], defaultValue: 'Individueel', span: 1 },
    { id: 'zonIdentiekeSystemen', label: 'NUMBER OF IDENTICAL SYSTEMS', type: 'text', defaultValue: '1', span: 1 },
    { id: 'zonMerkType', label: 'BRAND & TYPE', type: 'text', defaultValue: '', span: 1 },
    { id: 'zonSysteem', label: 'INSTALLATION TYPE', type: 'select', options: ['PV-panelen', 'PVT-panelen', 'Zonneboiler'], defaultValue: 'PV-panelen', span: 1 },
    { id: 'zonWattpiekvermogen', label: 'POWER / WATTPIEK', type: 'text', defaultValue: '', span: 1 },
    { id: 'zonAantal', label: 'COUNT / AANTAL', type: 'text', defaultValue: '', span: 1 },
    { id: 'zonOrientatie', label: 'ORIENTATION / ORIENTATIE', type: 'select', options: ['Zuid', 'Zuid-West', 'West', 'Oost', 'Noord'], defaultValue: 'Zuid', span: 1 },
    { id: 'zonHellingshook', label: 'TILT ANGLE / HELLINGSHOEK', type: 'text', defaultValue: '', span: 1 },
    { id: 'zonBouwintegratie', label: 'SHADING / BOUWINTEGRATIE', type: 'select', options: ['Niet geventileerd: zonder luchtspouw', 'Matig geventileerd: met luchtspouw', 'Sterk geventileerd: open draagconstructie', 'Op dakbedekking', 'Onbekend'], defaultValue: 'Onbekend', span: 2 },
  ]
};
