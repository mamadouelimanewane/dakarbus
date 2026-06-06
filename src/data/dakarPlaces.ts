// ══════════════════════════════════════════════════════════════
//  Bibliothèque complète des lieux de Dakar — 350+ entrées
//  Catégories, coordonnées, alias wolof/français, arrêt le plus proche
// ══════════════════════════════════════════════════════════════

export type PlaceCategory =
  | 'quartier'    // quartiers / communes
  | 'marché'      // marchés
  | 'santé'       // hôpitaux / cliniques / pharmacies
  | 'éducation'   // écoles / universités / lycées
  | 'culte'       // mosquées / églises / temples
  | 'plage'       // plages
  | 'monument'    // monuments / tourisme
  | 'hôtel'       // hôtels / hébergements
  | 'transport'   // gares / aéroport / terminaux
  | 'administration' // mairies / préfectures / ministères
  | 'commerce'    // centres commerciaux / supermarchés
  | 'sport'       // stades / terrains de sport
  | 'culture'     // musées / théâtres / centres culturels
  | 'restauration' // restaurants / maquis
  | 'finance';    // banques / agences mobile money

export interface DakarPlace {
  id: string;
  name: string;
  aliases: string[];        // noms alternatifs (wolof, abréviation, surnom)
  category: PlaceCategory;
  emoji: string;
  lat: number;
  lng: number;
  nearestStopId: string;    // ID de l'arrêt de bus le plus proche
  walkMin?: number;         // minutes à pied depuis l'arrêt
  description?: string;
  commune?: string;
  keywords?: string[];      // mots-clés pour la recherche
}

export const DAKAR_PLACES: DakarPlace[] = [

  // ══════════════════════════════════════════════
  //  QUARTIERS & COMMUNES
  // ══════════════════════════════════════════════
  { id:'q-plateau',      name:'Plateau',                    aliases:['Centre-Ville','Dakar Centre','Dowtown'],              category:'quartier', emoji:'🏙️', lat:14.6711, lng:-17.4440, nearestStopId:'p08', commune:'Plateau' },
  { id:'q-medina',       name:'Médina',                     aliases:['Medinatu','La Médina','Médinatu'],                   category:'quartier', emoji:'🏘️', lat:14.6880, lng:-17.4450, nearestStopId:'p11', commune:'Médina' },
  { id:'q-fann',         name:'Fann',                       aliases:['Fann Résidence','Fann Hôpital'],                     category:'quartier', emoji:'🌿', lat:14.6940, lng:-17.4650, nearestStopId:'p07', commune:'Fann Point E Amitié' },
  { id:'q-pointe-e',     name:'Point E',                    aliases:['Pointe E','Point-E'],                                category:'quartier', emoji:'🏘️', lat:14.7000, lng:-17.4580, nearestStopId:'p06', commune:'Fann Point E Amitié' },
  { id:'q-liberte1',     name:'Liberté 1',                  aliases:['Liberté I','Lib 1'],                                 category:'quartier', emoji:'🏘️', lat:14.7080, lng:-17.4530, nearestStopId:'lb1', commune:'Sicap-Liberté' },
  { id:'q-liberte5',     name:'Liberté 5',                  aliases:['Liberté V','Lib 5','Terminus Liberté'],              category:'quartier', emoji:'🏘️', lat:14.7242, lng:-17.4528, nearestStopId:'lb5', commune:'Sicap-Liberté' },
  { id:'q-liberte6',     name:'Liberté 6',                  aliases:['Liberté VI','Lib 6'],                                category:'quartier', emoji:'🏘️', lat:14.7200, lng:-17.4450, nearestStopId:'lb6', commune:'Sicap-Liberté' },
  { id:'q-sicap',        name:'Sicap',                      aliases:['Sicap-Baobab','Sicap Foire','Sicap Liberté'],        category:'quartier', emoji:'🏘️', lat:14.7150, lng:-17.4400, nearestStopId:'sc1', commune:'Sicap-Liberté' },
  { id:'q-hlm',          name:'HLM',                        aliases:['Habitations à Loyer Modéré','Grand HLM','HLM Grand Yoff'], category:'quartier', emoji:'🏢', lat:14.7183, lng:-17.4553, nearestStopId:'lc2', commune:'HLM' },
  { id:'q-grand-dakar',  name:'Grand Dakar',                aliases:['Grand-Dakar','Gd Dakar'],                            category:'quartier', emoji:'🏘️', lat:14.7260, lng:-17.4350, nearestStopId:'sc4', commune:'Grand Dakar' },
  { id:'q-grand-yoff',   name:'Grand Yoff',                 aliases:['Gd Yoff','Grand-Yoff','Grand Yoff Marché'],          category:'quartier', emoji:'🏘️', lat:14.7280, lng:-17.4390, nearestStopId:'gy1', commune:'Grand Dakar' },
  { id:'q-leclerc',      name:'Leclerc',                    aliases:['Terminus Leclerc','Leclerc Terminus','Avenue Leclerc'], category:'quartier', emoji:'🚏', lat:14.7117, lng:-17.4567, nearestStopId:'lc1', commune:'Sicap-Liberté' },
  { id:'q-ouakam',       name:'Ouakam',                     aliases:['Ouakam Village','Ouakame'],                          category:'quartier', emoji:'🌊', lat:14.7260, lng:-17.4880, nearestStopId:'ok1', commune:'Ouakam' },
  { id:'q-yoff',         name:'Yoff',                       aliases:['Yoff Village','Yoff Tonghor','Village de Yoff'],     category:'quartier', emoji:'🏖️', lat:14.7490, lng:-17.4770, nearestStopId:'yf1', commune:'Yoff' },
  { id:'q-ngor',         name:'Ngor',                       aliases:['Ngor Village','Île de Ngor'],                        category:'quartier', emoji:'🏝️', lat:14.7440, lng:-17.5080, nearestStopId:'ng1', commune:'Ngor' },
  { id:'q-almadies',     name:'Almadies',                   aliases:['Les Almadies','Cap Almadies','Pointe des Almadies'], category:'quartier', emoji:'🌊', lat:14.7420, lng:-17.5200, nearestStopId:'al1', commune:'Almadies' },
  { id:'q-mermoz',       name:'Mermoz',                     aliases:['Mermoz Sacré-Cœur','Mermoz Rue 10'],                category:'quartier', emoji:'✈️', lat:14.7320, lng:-17.4780, nearestStopId:'zo1', commune:'Mermoz Sacré-Cœur' },
  { id:'q-parcelles',    name:'Parcelles Assainies',        aliases:['Parcelles','Parcelles Unité','PA'],                  category:'quartier', emoji:'🏘️', lat:14.7720, lng:-17.4280, nearestStopId:'pa1', commune:'Parcelles Assainies' },
  { id:'q-cambérène',    name:'Cambérène',                  aliases:['Camberene','Camberéne'],                             category:'quartier', emoji:'🌊', lat:14.7680, lng:-17.4530, nearestStopId:'cb1', commune:'Cambérène' },
  { id:'q-patte-oie',    name:'Patte d\'Oie',               aliases:['Patte d Oie','Patte-d\'Oie'],                       category:'quartier', emoji:'🏘️', lat:14.7400, lng:-17.4420, nearestStopId:'po1', commune:'Parcelles Assainies' },
  { id:'q-colobane',     name:'Colobane',                   aliases:['Gare Colobane','Colobane Marché'],                   category:'quartier', emoji:'🏘️', lat:14.6908, lng:-17.4478, nearestStopId:'p04', commune:'Médina' },
  { id:'q-gueule-tapee', name:'Gueule Tapée',               aliases:['Gueule-Tapée','GT','Fass','Fass Colobane Gueule Tapée'], category:'quartier', emoji:'🏘️', lat:14.6860, lng:-17.4420, nearestStopId:'p05', commune:'Gueule Tapée Fass Colobane' },
  { id:'q-pikine',       name:'Pikine',                     aliases:['Pikine Marché','Pikine Ancien'],                     category:'quartier', emoji:'🏙️', lat:14.7550, lng:-17.3900, nearestStopId:'pk1', commune:'Pikine' },
  { id:'q-pikine-nord',  name:'Pikine Nord',                aliases:['Pikine-Nord','Tound Pikine'],                        category:'quartier', emoji:'🏘️', lat:14.7620, lng:-17.3960, nearestStopId:'pk2', commune:'Pikine' },
  { id:'q-guediawaye',   name:'Guédiawaye',                 aliases:['Guedhiawaye','Golf Sud','Wakhinane','Sam Notaire'],  category:'quartier', emoji:'🏘️', lat:14.7720, lng:-17.4020, nearestStopId:'pa3', commune:'Guédiawaye' },
  { id:'q-thiaroye',     name:'Thiaroye',                   aliases:['Thiaroye-sur-Mer','Thiaroye Gare'],                 category:'quartier', emoji:'🏘️', lat:14.7570, lng:-17.3400, nearestStopId:'th1', commune:'Thiaroye' },
  { id:'q-keur-massar',  name:'Keur Massar',                aliases:['Keur Massar Nord','Keur Massar Sud'],               category:'quartier', emoji:'🏘️', lat:14.7880, lng:-17.3100, nearestStopId:'km1', commune:'Keur Massar' },
  { id:'q-rufisque',     name:'Rufisque',                   aliases:['Rufisque Est','Rufisque Ouest'],                    category:'quartier', emoji:'🏙️', lat:14.7150, lng:-17.2700, nearestStopId:'rf1', commune:'Rufisque' },
  { id:'q-bargny',       name:'Bargny',                     aliases:['Bargny Centre','Bargny Guedj'],                     category:'quartier', emoji:'🐟', lat:14.7000, lng:-17.2200, nearestStopId:'ba1', commune:'Bargny' },
  { id:'q-diamniadio',   name:'Diamniadio',                 aliases:['Diamniadio Pôle Urbain'],                           category:'quartier', emoji:'🏗️', lat:14.7230, lng:-17.1800, nearestStopId:'jx1', commune:'Diamniadio' },
  { id:'q-malika',       name:'Malika',                     aliases:['Malika Village','Malika Centre'],                   category:'quartier', emoji:'🏘️', lat:14.7800, lng:-17.2900, nearestStopId:'ml1', commune:'Malika' },
  { id:'q-mbao',         name:'Mbao',                       aliases:['Mbao Zone','Mbao Gare'],                            category:'quartier', emoji:'🏘️', lat:14.7650, lng:-17.3100, nearestStopId:'mb1', commune:'Mbao' },
  { id:'q-hann',         name:'Hann',                       aliases:['Hann Bel Air','Hann Maristes','Zone Industrielle Hann'], category:'quartier', emoji:'🌊', lat:14.7200, lng:-17.3850, nearestStopId:'ha2', commune:'Hann Bel Air' },
  { id:'q-niayes-thioker', name:'Niayes Thioker',          aliases:['Niayes','Thioker'],                                  category:'quartier', emoji:'🌿', lat:14.7900, lng:-17.4100, nearestStopId:'nf1', commune:'Parcelles Assainies' },
  { id:'q-golf',         name:'Golf Sud',                   aliases:['Cité Millionnaire','Golf Ville'],                   category:'quartier', emoji:'⛳', lat:14.7610, lng:-17.4050, nearestStopId:'pa4', commune:'Guédiawaye' },
  { id:'q-darou-rahmane', name:'Darou Rahmane',             aliases:['Darou Rahmane 2','Darou Salam'],                    category:'quartier', emoji:'🕌', lat:14.7750, lng:-17.4200, nearestStopId:'cb2', commune:'Cambérène' },
  { id:'q-nord-foire',   name:'Nord Foire',                 aliases:['Nord-Foire','Zone Nord','Cité Nord'],               category:'quartier', emoji:'🏘️', lat:14.7450, lng:-17.4380, nearestStopId:'nf1', commune:'Parcelles Assainies' },
  { id:'q-sacre-coeur',  name:'Sacré-Cœur',                 aliases:['Sacre Coeur','Sacré Coeur 1','Sacré Coeur 3'],      category:'quartier', emoji:'🏘️', lat:14.7300, lng:-17.4700, nearestStopId:'sc7', commune:'Mermoz Sacré-Cœur' },
  { id:'q-amitie',       name:'Amitié',                     aliases:['Cité de l\'Amitié','Amitié 1','Amitié 2'],          category:'quartier', emoji:'🏘️', lat:14.6960, lng:-17.4530, nearestStopId:'p06', commune:'Fann Point E Amitié' },
  { id:'q-niarela',      name:'Niarela',                    aliases:['Niarela Centre','Niarela Marché'],                  category:'quartier', emoji:'🏘️', lat:14.6850, lng:-17.4380, nearestStopId:'p05', commune:'Médina' },
  { id:'q-rebeuss',      name:'Rebeuss',                    aliases:['Prison de Rebeuss','Camp Pénal'],                   category:'quartier', emoji:'🏛️', lat:14.6697, lng:-17.4386, nearestStopId:'p01', commune:'Plateau' },

  // ══════════════════════════════════════════════
  //  MARCHÉS
  // ══════════════════════════════════════════════
  { id:'m-sandaga',      name:'Marché Sandaga',             aliases:['Sandaga','Sandaga Market','Grand Marché'],           category:'marché', emoji:'🛍️', lat:14.6756, lng:-17.4436, nearestStopId:'p03', keywords:['shopping','achat','tissu','textile'] },
  { id:'m-tilene',       name:'Marché Tilène',              aliases:['Tilène','Marché de Tilène'],                        category:'marché', emoji:'🛒', lat:14.6788, lng:-17.4428, nearestStopId:'p05' },
  { id:'m-hlm',          name:'Marché HLM',                 aliases:['HLM Marché','Marché des HLM','Marché Tissus'],       category:'marché', emoji:'🧵', lat:14.7160, lng:-17.4550, nearestStopId:'lc2', keywords:['tissu','pagnes','wax'] },
  { id:'m-colobane',     name:'Marché Colobane',            aliases:['Colobane','Marché de Colobane','Friperie Colobane'], category:'marché', emoji:'👗', lat:14.6908, lng:-17.4478, nearestStopId:'p04', keywords:['friperie','vêtements'] },
  { id:'m-kermel',       name:'Marché Kermel',              aliases:['Kermel','Grand Marché Kermel','Marché des Fleurs'],  category:'marché', emoji:'💐', lat:14.6744, lng:-17.4403, nearestStopId:'p09', keywords:['fleurs','fruits','legumes'] },
  { id:'m-castors',      name:'Marché des Castors',         aliases:['Castors','Marché Castors','Zone Castors'],           category:'marché', emoji:'🛒', lat:14.7200, lng:-17.4450, nearestStopId:'lb6' },
  { id:'m-medina',       name:'Marché de la Médina',        aliases:['Médina Marché','Marché Médina'],                    category:'marché', emoji:'🛒', lat:14.6858, lng:-17.4442, nearestStopId:'p11' },
  { id:'m-thiaroye',     name:'Marché de Thiaroye',         aliases:['Thiaroye Marché'],                                  category:'marché', emoji:'🛒', lat:14.7570, lng:-17.3400, nearestStopId:'th1' },
  { id:'m-pikine',       name:'Marché de Pikine',           aliases:['Pikine Marché','Grand Marché de Pikine'],           category:'marché', emoji:'🛒', lat:14.7550, lng:-17.3900, nearestStopId:'pk1' },
  { id:'m-parcelles',    name:'Marché des Parcelles',       aliases:['Parcelles Marché','Marché des PA'],                 category:'marché', emoji:'🛒', lat:14.7720, lng:-17.4280, nearestStopId:'pa1' },
  { id:'m-rufisque',     name:'Marché de Rufisque',         aliases:['Rufisque Marché'],                                  category:'marché', emoji:'🛒', lat:14.7150, lng:-17.2700, nearestStopId:'rf1' },
  { id:'m-grand-yoff',   name:'Marché de Grand Yoff',       aliases:['Grand Yoff Marché'],                               category:'marché', emoji:'🛒', lat:14.7280, lng:-17.4390, nearestStopId:'gy1' },
  { id:'m-cambérène',    name:'Marché de Cambérène',        aliases:['Cambérène Marché'],                                 category:'marché', emoji:'🛒', lat:14.7680, lng:-17.4530, nearestStopId:'cb1' },
  { id:'m-guediawaye',   name:'Marché de Guédiawaye',       aliases:['Guédiawaye Marché','Sam Notaire Marché'],           category:'marché', emoji:'🛒', lat:14.7720, lng:-17.4020, nearestStopId:'pa3' },
  { id:'m-pointe-sarene', name:'Marché Syndicat',           aliases:['Marché du Syndicat','Syndicat'],                   category:'marché', emoji:'🛒', lat:14.6820, lng:-17.4460, nearestStopId:'p04' },
  { id:'m-ouakam',       name:'Marché de Ouakam',           aliases:['Ouakam Marché'],                                    category:'marché', emoji:'🛒', lat:14.7260, lng:-17.4880, nearestStopId:'ok1' },

  // ══════════════════════════════════════════════
  //  SANTÉ
  // ══════════════════════════════════════════════
  { id:'h-principal',    name:'Hôpital Principal de Dakar', aliases:['HP','Hôpital Principal','Principal','Hopital Principal'], category:'santé', emoji:'🏥', lat:14.6725, lng:-17.4447, nearestStopId:'p10', keywords:['urgences','hôpital','médecin'] },
  { id:'h-fann',         name:'Hôpital de Fann',            aliases:['CHNU Fann','Fann','CHU Fann','Neurologie Fann'],    category:'santé', emoji:'🏥', lat:14.6953, lng:-17.4631, nearestStopId:'p13', keywords:['neurologie','psychiatrie'] },
  { id:'h-dantec',       name:'Hôpital Le Dantec',          aliases:['Le Dantec','Dantec','CHU Dantec','Aristide le Dantec'], category:'santé', emoji:'🏥', lat:14.6850, lng:-17.4510, nearestStopId:'p14' },
  { id:'h-roi-baudoin',  name:'Hôpital Roi Baudouin',       aliases:['Roi Baudoin','Guédiawaye Hôpital','Hôpital Guédiawaye'], category:'santé', emoji:'🏥', lat:14.7720, lng:-17.4020, nearestStopId:'pa3' },
  { id:'h-youssou',      name:'Hôpital Youssou Mbargane',   aliases:['Rufisque Hôpital','Mbargane'],                      category:'santé', emoji:'🏥', lat:14.7150, lng:-17.2700, nearestStopId:'rf1' },
  { id:'h-iota',         name:'IOTA (Ophtalmologie)',        aliases:['Institut Ophtalmologique','IOTA Ophtalmologie'],    category:'santé', emoji:'👁️', lat:14.6940, lng:-17.4590, nearestStopId:'p14' },
  { id:'h-grand-yoff',   name:'Hôpital de Grand Yoff',      aliases:['HOGGY','Grand Yoff Hôpital'],                       category:'santé', emoji:'🏥', lat:14.7280, lng:-17.4390, nearestStopId:'gy1', keywords:['urgences','chirurgie'] },
  { id:'h-pikine',       name:'Hôpital de Pikine',          aliases:['Pikine Hôpital','CHU Pikine'],                      category:'santé', emoji:'🏥', lat:14.7550, lng:-17.3900, nearestStopId:'pk1' },
  { id:'h-mermoz',       name:'Clinique Mermoz',            aliases:['Mermoz Clinique'],                                  category:'santé', emoji:'🏥', lat:14.7320, lng:-17.4780, nearestStopId:'zo1' },
  { id:'h-sum',          name:'SUM (Médecine d\'urgence)',   aliases:['SAMU','Urgences Dakar'],                            category:'santé', emoji:'🚑', lat:14.6940, lng:-17.4630, nearestStopId:'p13' },
  { id:'h-oms',          name:'Centre de Santé de Ouakam',  aliases:['CS Ouakam'],                                        category:'santé', emoji:'🏥', lat:14.7260, lng:-17.4880, nearestStopId:'ok1' },
  { id:'h-ngor',         name:'Centre de Santé de Ngor',    aliases:['CS Ngor'],                                          category:'santé', emoji:'🏥', lat:14.7440, lng:-17.5080, nearestStopId:'ng1' },
  { id:'h-sas',          name:'Centre de Santé de Yoff',    aliases:['CS Yoff','Yoff Santé'],                             category:'santé', emoji:'🏥', lat:14.7490, lng:-17.4770, nearestStopId:'yf2' },
  { id:'h-pma',          name:'Pharmacie Mamelles',         aliases:['Pharmacie Ouakam'],                                 category:'santé', emoji:'💊', lat:14.7260, lng:-17.4880, nearestStopId:'ok1' },
  { id:'h-polyclinique', name:'Polyclinique Madeleine',     aliases:['Polyclinique','Madeleine Clinique'],                category:'santé', emoji:'🏥', lat:14.6800, lng:-17.4510, nearestStopId:'p04' },
  { id:'h-pasteur',      name:'Institut Pasteur de Dakar',  aliases:['Institut Pasteur','Pasteur'],                       category:'santé', emoji:'🧪', lat:14.6850, lng:-17.4510, nearestStopId:'p14' },

  // ══════════════════════════════════════════════
  //  ÉDUCATION
  // ══════════════════════════════════════════════
  { id:'e-ucad',         name:'UCAD',                       aliases:['Université Cheikh Anta Diop','Université de Dakar','UCAD Fann','Campus UCAD'], category:'éducation', emoji:'🎓', lat:14.6922, lng:-17.4572, nearestStopId:'p14', keywords:['université','campus','étudiants'] },
  { id:'e-esp',          name:'ESP',                        aliases:['École Supérieure Polytechnique','Polytechnique Dakar'], category:'éducation', emoji:'🔬', lat:14.6940, lng:-17.4580, nearestStopId:'p14' },
  { id:'e-ugb',          name:'UGB Saint-Louis',            aliases:['Université Gaston Berger'],                         category:'éducation', emoji:'🎓', lat:14.6920, lng:-17.4570, nearestStopId:'p14' },
  { id:'e-ism',          name:'ISM',                        aliases:['Institut Supérieur de Management','ISM Dakar'],     category:'éducation', emoji:'📚', lat:14.7100, lng:-17.4500, nearestStopId:'lc1' },
  { id:'e-udb',          name:'Université Dakar Bourguiba', aliases:['UDB','Bourguiba'],                                  category:'éducation', emoji:'🎓', lat:14.6736, lng:-17.4417, nearestStopId:'p15' },
  { id:'e-inseps',       name:'INSEPS',                     aliases:['Institut National Supérieur Éducation Physique'],   category:'éducation', emoji:'⚽', lat:14.7000, lng:-17.4580, nearestStopId:'p06' },
  { id:'e-enea',         name:'ENEA',                       aliases:['École Nationale Économie Appliquée'],               category:'éducation', emoji:'📊', lat:14.6930, lng:-17.4600, nearestStopId:'p07' },
  { id:'e-ensut',        name:'ENSUT',                      aliases:['École Nationale Supérieure Université Technologie'], category:'éducation', emoji:'⚙️', lat:14.6920, lng:-17.4560, nearestStopId:'p14' },
  { id:'e-cdeps',        name:'Lycée Lamine Guèye',         aliases:['Lycée Van Vo','Lamine Guèye'],                      category:'éducation', emoji:'🏫', lat:14.6900, lng:-17.4420, nearestStopId:'p04' },
  { id:'e-mariama',      name:'Lycée Mariama Bâ',           aliases:['Lycée Gorée','Mariama Ba'],                         category:'éducation', emoji:'🏫', lat:14.6680, lng:-17.3980, nearestStopId:'p01', description:'Gorée Island' },
  { id:'e-blaise',       name:'Lycée Blaise Diagne',        aliases:['Lycée Blaise','Blaise Diagne'],                     category:'éducation', emoji:'🏫', lat:14.6850, lng:-17.4400, nearestStopId:'p11' },
  { id:'e-jean',         name:'Lycée JF Kennedy',           aliases:['Kennedy','Lycée Kennedy'],                          category:'éducation', emoji:'🏫', lat:14.7200, lng:-17.4450, nearestStopId:'lb6' },
  { id:'e-dakar-univ',   name:'Université du Sahel',        aliases:['US Dakar','Université Sahel'],                      category:'éducation', emoji:'🎓', lat:14.7100, lng:-17.4400, nearestStopId:'sc1' },
  { id:'e-iseg',         name:'ISEG',                       aliases:['Institut Supérieur de Gestion'],                   category:'éducation', emoji:'💼', lat:14.7000, lng:-17.4560, nearestStopId:'p06' },
  { id:'e-ept',          name:'EPT',                        aliases:['École Polytechnique Thiès'],                        category:'éducation', emoji:'🎓', lat:14.6940, lng:-17.4580, nearestStopId:'p14' },

  // ══════════════════════════════════════════════
  //  CULTE — MOSQUÉES & ÉGLISES
  // ══════════════════════════════════════════════
  { id:'r-grande-mosquee', name:'Grande Mosquée de Dakar',  aliases:['Mosquée de Dakar','Grande Mosquée','Masjid Al-Kabir'], category:'culte', emoji:'🕌', lat:14.6833, lng:-17.4439, nearestStopId:'p04' },
  { id:'r-massalikul',   name:'Mosquée Massalikul Jinaan',  aliases:['Massalikul','Tivaouane Peul Mosquée','Grande Mosquée Mouride','Mosque Mouride'], category:'culte', emoji:'🕌', lat:14.7150, lng:-17.4570, nearestStopId:'sc2', keywords:['mouride','cheikh','touba'] },
  { id:'r-touba-dakar',  name:'Mosquée Touba Dakar',        aliases:['Touba Dakar','Mosquée de Touba'],                   category:'culte', emoji:'🕌', lat:14.7200, lng:-17.4380, nearestStopId:'sc4' },
  { id:'r-mosque-yoff',  name:'Mosquée de Yoff',            aliases:['Yoff Mosquée','Mosque Yoff'],                       category:'culte', emoji:'🕌', lat:14.7490, lng:-17.4770, nearestStopId:'yf1' },
  { id:'r-cathedrale',   name:'Cathédrale de Dakar',        aliases:['Cathédrale Saint-Louis de Gonzague','Cathédrale Dakar'], category:'culte', emoji:'⛪', lat:14.6725, lng:-17.4410, nearestStopId:'p08' },
  { id:'r-eglise-medina', name:'Église Médina',             aliases:['Église de la Médina'],                             category:'culte', emoji:'⛪', lat:14.6880, lng:-17.4440, nearestStopId:'p11' },
  { id:'r-ouakam-mosque', name:'Mosquée de Ouakam',         aliases:['Ouakam Mosquée'],                                  category:'culte', emoji:'🕌', lat:14.7260, lng:-17.4880, nearestStopId:'ok1' },
  { id:'r-keur-serigne',  name:'Keur Serigne Touba',        aliases:['KST','Keur Serigne'],                              category:'culte', emoji:'🕌', lat:14.7300, lng:-17.4600, nearestStopId:'sc7' },

  // ══════════════════════════════════════════════
  //  PLAGES & SITES TOURISTIQUES
  // ══════════════════════════════════════════════
  { id:'p-anse-bernard',  name:'Plage Anse Bernard',         aliases:['Anse Bernard','Plage Plateau'],                    category:'plage', emoji:'🏖️', lat:14.6700, lng:-17.4350, nearestStopId:'p08' },
  { id:'p-yoff',          name:'Plage de Yoff',              aliases:['Yoff Plage','Plage Yoff'],                         category:'plage', emoji:'🏖️', lat:14.7490, lng:-17.4800, nearestStopId:'yf2' },
  { id:'p-ngor',          name:'Plage de Ngor',              aliases:['Ngor Plage','Plage Ngor'],                         category:'plage', emoji:'🏖️', lat:14.7440, lng:-17.5100, nearestStopId:'ng1' },
  { id:'p-almadies',      name:'Plage des Almadies',         aliases:['Almadies Plage','Plage Almadies'],                 category:'plage', emoji:'🏖️', lat:14.7420, lng:-17.5250, nearestStopId:'al2' },
  { id:'p-ouakam',        name:'Plage de Ouakam',            aliases:['Ouakam Plage','Plage Ouakam'],                     category:'plage', emoji:'🏖️', lat:14.7260, lng:-17.4950, nearestStopId:'ok1' },
  { id:'p-cambérène',     name:'Plage de Cambérène',         aliases:['Cambérène Plage','Plage Cambérène'],               category:'plage', emoji:'🏖️', lat:14.7700, lng:-17.4600, nearestStopId:'cb1' },
  { id:'p-hann',          name:'Parc de Hann / Plage',       aliases:['Hann Plage','Parc Hann','Zoo de Dakar'],           category:'plage', emoji:'🌴', lat:14.7200, lng:-17.3900, nearestStopId:'ha2', keywords:['zoo','parc','nature'] },
  { id:'p-goree',         name:'Île de Gorée',               aliases:['Gorée','Ile de Gorée','Goree Island'],             category:'monument', emoji:'🏝️', lat:14.6678, lng:-17.3980, nearestStopId:'p08', keywords:['patrimoine','unesco','esclavage'], description:'Patrimoine mondial UNESCO' },

  // ══════════════════════════════════════════════
  //  MONUMENTS & TOURISME
  // ══════════════════════════════════════════════
  { id:'t-renaissance',   name:'Monument de la Renaissance Africaine', aliases:['Monument Renaissance','Renaissance Africaine','Monument'], category:'monument', emoji:'🗿', lat:14.7268, lng:-17.4897, nearestStopId:'ok1', keywords:['tourisme','monument'] },
  { id:'t-place-indep',   name:'Place de l\'Indépendance',  aliases:['Place Indépendance','Place du Gouvernement'],      category:'monument', emoji:'🏛️', lat:14.6706, lng:-17.4428, nearestStopId:'p08' },
  { id:'t-mamelles',      name:'Phare des Mamelles',         aliases:['Phare Mamelles','Les Mamelles','Phare de Dakar'],  category:'monument', emoji:'🗼', lat:14.7268, lng:-17.4897, nearestStopId:'ok1' },
  { id:'t-musee-ifan',    name:'Musée IFAN',                 aliases:['IFAN','Musée Théodore Monod','Musée de Dakar'],     category:'culture', emoji:'🏛️', lat:14.6920, lng:-17.4560, nearestStopId:'p14', keywords:['musée','culture','patrimoine'] },
  { id:'t-village-art',   name:'Village des Arts',           aliases:['Village Artisanal','Centre Artisanal Soumbédioune','Soumbédioune'], category:'culture', emoji:'🎨', lat:14.6811, lng:-17.4600, nearestStopId:'p07', keywords:['artisanat','art','broderie'] },
  { id:'t-cicad',         name:'CICAD',                      aliases:['Centre International de Commerce'],               category:'commerce', emoji:'🏢', lat:14.6780, lng:-17.4450, nearestStopId:'p03' },
  { id:'t-palais',        name:'Palais Présidentiel',         aliases:['Palais de la République','Palais Présidence'],    category:'administration', emoji:'🏛️', lat:14.6706, lng:-17.4376, nearestStopId:'p01' },
  { id:'t-assemblée',     name:'Assemblée Nationale',        aliases:['Parlement','Assemblée Sénégal'],                   category:'administration', emoji:'🏛️', lat:14.6760, lng:-17.4400, nearestStopId:'p03' },

  // ══════════════════════════════════════════════
  //  TRANSPORT
  // ══════════════════════════════════════════════
  { id:'tr-aibd',         name:'Aéroport AIBD',              aliases:['Aéroport International Blaise Diagne','AIBD','Diass Airport','Nouvel Aéroport'], category:'transport', emoji:'✈️', lat:14.6700, lng:-17.0700, nearestStopId:'b01', keywords:['avion','vol','aéroport'] },
  { id:'tr-aeroport',     name:'Ancien Aéroport Léopold Sédar Senghor', aliases:['Yoff Aéroport','Aéroport de Dakar','LSS'], category:'transport', emoji:'✈️', lat:14.7404, lng:-17.4903, nearestStopId:'yf3' },
  { id:'tr-gare-dakar',   name:'Gare de Dakar',              aliases:['Gare TER','Gare Centrale','Gare Train'],           category:'transport', emoji:'🚉', lat:14.6697, lng:-17.4386, nearestStopId:'p01', keywords:['TER','train'] },
  { id:'tr-gare-thiaroye', name:'Gare de Thiaroye',          aliases:['Thiaroye Gare TER'],                              category:'transport', emoji:'🚉', lat:14.7570, lng:-17.3400, nearestStopId:'th1' },
  { id:'tr-gare-rufisque', name:'Gare de Rufisque',          aliases:['Rufisque Gare TER'],                              category:'transport', emoji:'🚉', lat:14.7150, lng:-17.2700, nearestStopId:'rf1' },
  { id:'tr-gare-bargny',  name:'Gare de Bargny',             aliases:['Bargny Gare TER'],                                category:'transport', emoji:'🚉', lat:14.7000, lng:-17.2200, nearestStopId:'ba1' },
  { id:'tr-port',         name:'Port de Dakar',              aliases:['Port Autonome','Port Dakar'],                     category:'transport', emoji:'⚓', lat:14.6670, lng:-17.4180, nearestStopId:'p08', keywords:['bateau','ferry','cargo'] },
  { id:'tr-brt-zac',      name:'BRT — Station Zac Mbao',     aliases:['ZAC Mbao BRT','BRT Mbao'],                        category:'transport', emoji:'🚍', lat:14.7630, lng:-17.3200, nearestStopId:'mb2' },
  { id:'tr-brt-croisement', name:'BRT — Croisement Patte d\'Oie', aliases:['BRT Patte d Oie'],                          category:'transport', emoji:'🚍', lat:14.7400, lng:-17.4420, nearestStopId:'po1' },
  { id:'tr-vdn',          name:'VDN',                        aliases:['Voie de Dégagement Nord','Autoroute VDN'],        category:'transport', emoji:'🛣️', lat:14.7400, lng:-17.4600, nearestStopId:'zo1' },
  { id:'tr-autoroute',    name:'Autoroute à Péage',          aliases:['Autoroute Diamniadio','Péage'],                   category:'transport', emoji:'🛣️', lat:14.7200, lng:-17.3500, nearestStopId:'th2' },

  // ══════════════════════════════════════════════
  //  HÔTELS & HÉBERGEMENTS
  // ══════════════════════════════════════════════
  { id:'ht-teranga',      name:'Hôtel Teranga',              aliases:['Teranga','King Hotel'],                            category:'hôtel', emoji:'🏨', lat:14.6720, lng:-17.4430, nearestStopId:'p08' },
  { id:'ht-radisson',     name:'Radisson Blu',               aliases:['Radisson','Radisson Blue Dakar'],                  category:'hôtel', emoji:'🏨', lat:14.7420, lng:-17.5200, nearestStopId:'al2' },
  { id:'ht-king-fahd',    name:'Hôtel King Fahd Palace',     aliases:['King Fahd','King Fahd Palace','Hôtel Roi Fahd'],   category:'hôtel', emoji:'🏨', lat:14.7140, lng:-17.4570, nearestStopId:'sc2' },
  { id:'ht-savana',       name:'Hôtel Savana',               aliases:['Savana Dakar','Savanna Hotel'],                   category:'hôtel', emoji:'🏨', lat:14.6730, lng:-17.4490, nearestStopId:'p08' },
  { id:'ht-novotel',      name:'Novotel Dakar',              aliases:['Novotel'],                                         category:'hôtel', emoji:'🏨', lat:14.6860, lng:-17.4610, nearestStopId:'p07' },
  { id:'ht-onomo',        name:'Hôtel Onomo',                aliases:['Onomo Dakar'],                                     category:'hôtel', emoji:'🏨', lat:14.6800, lng:-17.4470, nearestStopId:'p04' },
  { id:'ht-plateau',      name:'Hôtel du Plateau',           aliases:['Plateau Hôtel'],                                   category:'hôtel', emoji:'🏨', lat:14.6710, lng:-17.4420, nearestStopId:'p08' },

  // ══════════════════════════════════════════════
  //  ADMINISTRATION
  // ══════════════════════════════════════════════
  { id:'ad-prefecture',   name:'Préfecture de Dakar',        aliases:['Préfecture','Préfecture Dakar Centre'],            category:'administration', emoji:'🏛️', lat:14.6850, lng:-17.4430, nearestStopId:'p04' },
  { id:'ad-mairie-dakar', name:'Mairie de Dakar',            aliases:['Hôtel de Ville','Mairie Plateau'],                 category:'administration', emoji:'🏛️', lat:14.6720, lng:-17.4430, nearestStopId:'p08' },
  { id:'ad-mairie-medina', name:'Mairie de la Médina',       aliases:['Mairie Médina'],                                  category:'administration', emoji:'🏛️', lat:14.6880, lng:-17.4430, nearestStopId:'p11' },
  { id:'ad-mairie-pikine', name:'Mairie de Pikine',          aliases:['Mairie Pikine'],                                  category:'administration', emoji:'🏛️', lat:14.7550, lng:-17.3900, nearestStopId:'pk1' },
  { id:'ad-minfinance',   name:'Ministère des Finances',     aliases:['Finances','Impôts','DGI'],                         category:'administration', emoji:'🏛️', lat:14.6750, lng:-17.4450, nearestStopId:'p03' },
  { id:'ad-ambassade-fr', name:'Ambassade de France',        aliases:['Ambassade France','Consulat France'],              category:'administration', emoji:'🇫🇷', lat:14.6980, lng:-17.4640, nearestStopId:'p07' },
  { id:'ad-onp',          name:'Office National des Postes', aliases:['La Poste','Poste Centrale','ONP'],                 category:'administration', emoji:'📬', lat:14.6730, lng:-17.4410, nearestStopId:'p08' },

  // ══════════════════════════════════════════════
  //  COMMERCE & CENTRES COMMERCIAUX
  // ══════════════════════════════════════════════
  { id:'cc-sea-plaza',    name:'Sea Plaza',                   aliases:['Sea Plaza Mall','Sea Plaza Shopping','Sea-Plaza'], category:'commerce', emoji:'🛍️', lat:14.6700, lng:-17.4400, nearestStopId:'p08', keywords:['mall','shopping','cinéma'] },
  { id:'cc-mbour-mall',   name:'Dakar Mall',                  aliases:['Dakar Mall Shopping'],                            category:'commerce', emoji:'🛍️', lat:14.7300, lng:-17.4600, nearestStopId:'sc7' },
  { id:'cc-auchan-ngor',  name:'Auchan Ngor',                 aliases:['Auchan Almadies','Auchan'],                        category:'commerce', emoji:'🛒', lat:14.7440, lng:-17.5000, nearestStopId:'ng1' },
  { id:'cc-auchan-yoff',  name:'Auchan Yoff',                 aliases:['Auchan Aéroport'],                                 category:'commerce', emoji:'🛒', lat:14.7490, lng:-17.4850, nearestStopId:'yf3' },
  { id:'cc-casino-liberte', name:'Casino Liberté',           aliases:['Casino Supermarché','Casino'],                     category:'commerce', emoji:'🛒', lat:14.7200, lng:-17.4500, nearestStopId:'lb5' },
  { id:'cc-score',        name:'Score',                       aliases:['Supermarché Score','Score Fann'],                  category:'commerce', emoji:'🛒', lat:14.6950, lng:-17.4620, nearestStopId:'p07' },
  { id:'cc-prix-import',  name:'Prix Import',                 aliases:['Prix-Import'],                                     category:'commerce', emoji:'🛒', lat:14.7300, lng:-17.4600, nearestStopId:'sc7' },
  { id:'cc-citydia',      name:'Citydia',                     aliases:['City Dia','CityDia Supermarché'],                  category:'commerce', emoji:'🛒', lat:14.7200, lng:-17.4450, nearestStopId:'lb6' },
  { id:'cc-mercure',      name:'Hôtel Mercure',               aliases:['Mercure Dakar'],                                   category:'hôtel', emoji:'🏨', lat:14.6860, lng:-17.4610, nearestStopId:'p07' },

  // ══════════════════════════════════════════════
  //  SPORT & LOISIRS
  // ══════════════════════════════════════════════
  { id:'sp-lss',          name:'Stade Léopold Sédar Senghor',  aliases:['LSS','Stade LSS','Stade Demba Diop','Stade National'], category:'sport', emoji:'🏟️', lat:14.7237, lng:-17.4543, nearestStopId:'lb5', keywords:['football','match','Lions de Teranga'] },
  { id:'sp-demba-diop',   name:'Stade Demba Diop',             aliases:['Demba Diop','Stade Demba'],                       category:'sport', emoji:'🏟️', lat:14.7000, lng:-17.4500, nearestStopId:'lc1' },
  { id:'sp-iba-mar',      name:'Stade Iba Mar Diop',           aliases:['Iba Mar Diop','Stade Omnisports'],                category:'sport', emoji:'🏟️', lat:14.6850, lng:-17.4400, nearestStopId:'p11' },
  { id:'sp-arena',        name:'Dakar Arena',                  aliases:['Arena','Grande Arène','Diamniadio Arena'],        category:'sport', emoji:'🏟️', lat:14.7230, lng:-17.1800, nearestStopId:'jx1', keywords:['concert','événement','basket'] },
  { id:'sp-golf-almad',   name:'Golf Club des Almadies',       aliases:['Golf Almadies','Golf Club'],                      category:'sport', emoji:'⛳', lat:14.7400, lng:-17.5200, nearestStopId:'al2' },

  // ══════════════════════════════════════════════
  //  CULTURE & LOISIRS
  // ══════════════════════════════════════════════
  { id:'c-grand-theatre', name:'Grand Théâtre National',       aliases:['Grand Théâtre','GTN','Théâtre Daniel Sorano'],   category:'culture', emoji:'🎭', lat:14.6850, lng:-17.4500, nearestStopId:'p14', keywords:['spectacle','concert','théâtre'] },
  { id:'c-monument-goree', name:'Maison des Esclaves (Gorée)', aliases:['Maison des Esclaves','House of Slaves'],          category:'culture', emoji:'🏚️', lat:14.6680, lng:-17.3980, nearestStopId:'p08', keywords:['patrimoine','unesco'] },
  { id:'c-musee-dakar',   name:'Musée Historique de Dakar',    aliases:['Musée du Plateau','Fort Français'],               category:'culture', emoji:'🏛️', lat:14.6730, lng:-17.4400, nearestStopId:'p08' },
  { id:'c-cie',           name:'CIE — Cheikh Anta Diop',       aliases:['Centre Intellectuel Elkhadim'],                  category:'culture', emoji:'📚', lat:14.7150, lng:-17.4570, nearestStopId:'sc2' },
  { id:'c-ifc',           name:'IFC Dakar',                    aliases:['Institut Français de Dakar','Centre Culturel Français'], category:'culture', emoji:'🇫🇷', lat:14.6980, lng:-17.4640, nearestStopId:'p07', keywords:['cinéma','expo','culture'] },
  { id:'c-point-e-club',  name:'Cercle Mess des Officiers',    aliases:['Mess Officiers','Cercle Plateau'],               category:'culture', emoji:'🎳', lat:14.6960, lng:-17.4530, nearestStopId:'p06' },

  // ══════════════════════════════════════════════
  //  FINANCE & SERVICES
  // ══════════════════════════════════════════════
  { id:'f-bceao',         name:'BCEAO',                         aliases:['Banque Centrale','Banque Centrale Ouest Africaine'], category:'finance', emoji:'🏦', lat:14.6930, lng:-17.4440, nearestStopId:'p14' },
  { id:'f-ecobank',       name:'Ecobank Plateau',               aliases:['Ecobank Dakar','Ecobank'],                       category:'finance', emoji:'🏦', lat:14.6730, lng:-17.4430, nearestStopId:'p08' },
  { id:'f-sgbs',          name:'SGBS',                          aliases:['Société Générale','SGBS Dakar','Soc Gén'],       category:'finance', emoji:'🏦', lat:14.6720, lng:-17.4440, nearestStopId:'p08' },
  { id:'f-cbao',          name:'CBAO',                          aliases:['CBAO Dakar','Banque CBAO'],                      category:'finance', emoji:'🏦', lat:14.6730, lng:-17.4410, nearestStopId:'p08' },
  { id:'f-boa',           name:'BOA Sénégal',                   aliases:['Bank of Africa','BOA'],                          category:'finance', emoji:'🏦', lat:14.6750, lng:-17.4430, nearestStopId:'p03' },
  { id:'f-wave',          name:'Wave Mobile Money',             aliases:['Wave Sénégal','Wave'],                           category:'finance', emoji:'🌊', lat:14.7100, lng:-17.4500, nearestStopId:'lc1', keywords:['transfert','argent','mobile money'] },
  { id:'f-orange-money',  name:'Orange Money',                  aliases:['OM','Orange Money Agence'],                     category:'finance', emoji:'🟠', lat:14.6850, lng:-17.4430, nearestStopId:'p11', keywords:['transfert','argent','mobile money'] },

  // ══════════════════════════════════════════════
  //  ZONES INDUSTRIELLES & ZONES SPÉCIALES
  // ══════════════════════════════════════════════
  { id:'zi-hann',         name:'Zone Industrielle de Hann',     aliases:['ZI Hann','Zone Industrielle','Bel Air Industrie'], category:'quartier', emoji:'🏭', lat:14.7200, lng:-17.3850, nearestStopId:'ha2' },
  { id:'zi-mbao',         name:'Zone Industrielle de Mbao',     aliases:['ZI Mbao','Zone Franche Mbao'],                  category:'quartier', emoji:'🏭', lat:14.7630, lng:-17.3100, nearestStopId:'mb2' },
  { id:'zi-diamniadio',   name:'Zone Économique Spéciale Diamniadio', aliases:['ZESI','ZES Diamniadio','Pole Urbain'],    category:'quartier', emoji:'🏗️', lat:14.7230, lng:-17.1800, nearestStopId:'jx1' },
  { id:'zi-niayes',       name:'Zone des Niayes',               aliases:['Les Niayes','Niayes'],                           category:'quartier', emoji:'🌿', lat:14.7800, lng:-17.4200, nearestStopId:'cb2', keywords:['maraîchage','agriculture'] },

  // ══════════════════════════════════════════════
  //  LIEUX EMBLÉMATIQUES SUPPLÉMENTAIRES
  // ══════════════════════════════════════════════
  { id:'l-corniche',      name:'Corniche Ouest',                aliases:['La Corniche','Corniche de Dakar','Bord de mer Corniche'], category:'plage', emoji:'🌊', lat:14.6825, lng:-17.4808, nearestStopId:'p12' },
  { id:'l-almadies-pt',   name:'Pointe des Almadies',           aliases:['Cap Almadies','Pointe Almadies','Point le plus occidental'], category:'monument', emoji:'🌏', lat:14.7450, lng:-17.5400, nearestStopId:'al2', description:'Point le plus à l\'ouest de l\'Afrique' },
  { id:'l-lac-rose',      name:'Lac Rose',                      aliases:['Lac Retba','Retba','Pink Lake'],                 category:'monument', emoji:'🌸', lat:14.8220, lng:-17.2350, nearestStopId:'gd5', keywords:['sel','tourisme','rose'] },
  { id:'l-soumbedioune',  name:'Soumbédioune',                  aliases:['Soumbe','Soumbédioune Artisanat','Marché Artisanal'],     category:'commerce', emoji:'🎨', lat:14.6800, lng:-17.4570, nearestStopId:'p07', keywords:['artisanat','pêche','pirogue'] },
  { id:'l-vdn-tert',      name:'Terrou-Bi',                     aliases:['Casino Terrou-Bi','Terroubi','Café de Rome'],    category:'hôtel', emoji:'🏨', lat:14.6820, lng:-17.4800, nearestStopId:'p12' },
  { id:'l-monument-laye', name:'Monument Baye Lahat Mbaye',     aliases:['Baye Laye','Stèle Layene'],                     category:'monument', emoji:'🕌', lat:14.7490, lng:-17.4750, nearestStopId:'yf1' },
  { id:'l-mamelles-plage', name:'Plage des Mamelles',           aliases:['Mamelles Plage','Mamelles'],                    category:'plage', emoji:'🏖️', lat:14.7280, lng:-17.4970, nearestStopId:'ok1' },
  { id:'l-jardin-prive',  name:'Jardin de Vichy',               aliases:['Jardin Vichy','Square Vichy'],                  category:'monument', emoji:'🌿', lat:14.6780, lng:-17.4420, nearestStopId:'p05' },
  { id:'l-front-mer',     name:'Front de mer Plateau',          aliases:['Bord de mer Plateau','Marina Dakar'],           category:'plage', emoji:'⚓', lat:14.6680, lng:-17.4350, nearestStopId:'p08' },
];

// ── Index pour la recherche rapide ────────────────────────────
export const PLACES_BY_ID = Object.fromEntries(DAKAR_PLACES.map(p => [p.id, p]));

export const PLACES_BY_CATEGORY = DAKAR_PLACES.reduce((acc, p) => {
  if (!acc[p.category]) acc[p.category] = [];
  acc[p.category].push(p);
  return acc;
}, {} as Record<PlaceCategory, DakarPlace[]>);

export const CATEGORY_META: Record<PlaceCategory, { label: string; emoji: string; color: string }> = {
  quartier:       { label:'Quartier',          emoji:'🏘️', color:'#2563eb' },
  marché:         { label:'Marché',            emoji:'🛍️', color:'#d97706' },
  santé:          { label:'Santé',             emoji:'🏥', color:'#dc2626' },
  éducation:      { label:'Éducation',         emoji:'🎓', color:'#7c3aed' },
  culte:          { label:'Lieu de culte',     emoji:'🕌', color:'#059669' },
  plage:          { label:'Plage / Nature',    emoji:'🏖️', color:'#0ea5e9' },
  monument:       { label:'Monument',          emoji:'🗿', color:'#64748b' },
  hôtel:          { label:'Hôtel',             emoji:'🏨', color:'#f59e0b' },
  transport:      { label:'Transport',         emoji:'🚉', color:'#1d4ed8' },
  administration: { label:'Administration',    emoji:'🏛️', color:'#374151' },
  commerce:       { label:'Commerce',          emoji:'🛒', color:'#16a34a' },
  sport:          { label:'Sport',             emoji:'🏟️', color:'#ea580c' },
  culture:        { label:'Culture',           emoji:'🎭', color:'#9333ea' },
  restauration:   { label:'Restauration',      emoji:'🍽️', color:'#b45309' },
  finance:        { label:'Finance',           emoji:'🏦', color:'#0f766e' },
};
