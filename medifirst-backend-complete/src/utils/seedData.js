const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const FirstAidGuide = require('../models/FirstAidGuide');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medifirst';

const guides = [
  {
    title: 'CPR (Cardiopulmonary Resuscitation)',
    category: 'cpr',
    description: 'CPR is a lifesaving technique used when someone\'s heart has stopped beating.',
    severity: 'critical',
    steps: [
      { stepNumber: 1, title: 'Check for Safety', description: 'Make sure the scene is safe for you and the victim.' },
      { stepNumber: 2, title: 'Check Responsiveness', description: 'Tap the person\'s shoulder firmly and shout "Are you OK?"' },
      { stepNumber: 3, title: 'Call Emergency Services', description: 'Call 911 or your local emergency number immediately.' },
      { stepNumber: 4, title: 'Open the Airway', description: 'Tilt the head back and lift the chin to open the airway.' },
      { stepNumber: 5, title: 'Check for Breathing', description: 'Look, listen and feel for normal breathing for no more than 10 seconds.', warning: 'Occasional gasps are not normal breathing' },
      { stepNumber: 6, title: 'Begin Chest Compressions', description: 'Place heel of hand on center of chest. Push hard and fast - at least 2 inches deep, 100-120 times per minute.' },
      { stepNumber: 7, title: 'Give Rescue Breaths', description: 'After 30 compressions, give 2 rescue breaths. Continue 30:2 ratio.' }
    ],
    warnings: ['Do not stop CPR until emergency services arrive', 'Use an AED if available'],
    whenToCallEmergency: ['Person is unresponsive', 'No normal breathing', 'No pulse'],
    tags: ['heart attack', 'cardiac arrest', 'resuscitation', 'emergency'],
    isOfflineAvailable: true
  },
  {
    title: 'Choking - Heimlich Maneuver',
    category: 'choking',
    description: 'The Heimlich maneuver is used to dislodge a foreign object from a person\'s airway.',
    severity: 'critical',
    steps: [
      { stepNumber: 1, title: 'Recognize Choking Signs', description: 'Look for: inability to speak, difficulty breathing, skin turning blue.' },
      { stepNumber: 2, title: 'Ask "Are You Choking?"', description: 'If the person can speak or cough, encourage them to keep coughing.' },
      { stepNumber: 3, title: 'Call for Help', description: 'Have someone call emergency services while you help.' },
      { stepNumber: 4, title: 'Perform Abdominal Thrusts', description: 'Stand behind the person. Make a fist above the navel. Give quick upward thrusts until object is expelled.' },
      { stepNumber: 5, title: 'For Unconscious Victim', description: 'If unconscious, lower to floor and begin CPR.', warning: 'Do not perform blind finger sweeps' }
    ],
    warnings: ['Do not perform Heimlich on infants under 1 year', 'Seek medical attention after Heimlich'],
    whenToCallEmergency: ['Person cannot breathe, speak or cough', 'Skin turns blue', 'Person becomes unconscious'],
    tags: ['choking', 'airway', 'obstruction', 'heimlich'],
    isOfflineAvailable: true
  },
  {
    title: 'Burns Treatment',
    category: 'burns',
    description: 'Proper treatment of burns reduces pain, prevents infection, and minimizes scarring.',
    severity: 'high',
    steps: [
      { stepNumber: 1, title: 'Ensure Safety', description: 'Remove the person from the source of the burn.' },
      { stepNumber: 2, title: 'Cool the Burn', description: 'Cool with running water for 10-20 minutes.', warning: 'Never use ice, butter, or toothpaste on a burn' },
      { stepNumber: 3, title: 'Remove Jewelry', description: 'Remove watches, rings, and tight clothing from the burned area.' },
      { stepNumber: 4, title: 'Cover the Burn', description: 'Cover with a sterile non-stick bandage or clean cloth.' },
      { stepNumber: 5, title: 'Pain Management', description: 'Give over-the-counter pain relievers if needed.' }
    ],
    warnings: ['Do not break blisters', 'Do not apply butter or oil', 'Seek medical attention for burns larger than 3 inches'],
    whenToCallEmergency: ['Burns cover large area', 'Burns on face, hands, or feet', 'Chemical or electrical burns'],
    tags: ['burns', 'fire', 'heat', 'chemical burn'],
    isOfflineAvailable: true
  },
  {
    title: 'Severe Bleeding Control',
    category: 'bleeding',
    description: 'Controlling severe bleeding is critical to prevent shock and save lives.',
    severity: 'critical',
    steps: [
      { stepNumber: 1, title: 'Protect Yourself', description: 'Use gloves or clean cloth to protect from bloodborne diseases.' },
      { stepNumber: 2, title: 'Apply Direct Pressure', description: 'Place a clean cloth on wound and press firmly.', warning: 'Do not remove cloth even if soaked. Add more on top.' },
      { stepNumber: 3, title: 'Elevate the Wound', description: 'Raise the injured area above the level of the heart.' },
      { stepNumber: 4, title: 'Apply Pressure Bandage', description: 'Wrap the wound firmly with a bandage.' },
      { stepNumber: 5, title: 'Monitor for Shock', description: 'Watch for pale, cold skin, rapid pulse, confusion.' }
    ],
    warnings: ['Do not remove embedded objects', 'Tourniquet is last resort only'],
    whenToCallEmergency: ['Bleeding does not slow after 10 minutes', 'Blood is spurting', 'Signs of shock'],
    tags: ['bleeding', 'wound', 'cut', 'laceration'],
    isOfflineAvailable: true
  },
  {
    title: 'Fracture (Broken Bone) Care',
    category: 'fractures',
    description: 'Proper handling of fractures prevents additional injury.',
    severity: 'high',
    steps: [
      { stepNumber: 1, title: 'Stop Any Bleeding', description: 'Apply gentle pressure with a clean bandage.' },
      { stepNumber: 2, title: 'Immobilize the Injury', description: 'Do not try to realign the bone. Use a splint.', warning: 'Never try to straighten a broken bone' },
      { stepNumber: 3, title: 'Apply Ice', description: 'Apply ice packs wrapped in cloth to reduce swelling.' },
      { stepNumber: 4, title: 'Treat for Shock', description: 'Lay person down, keep warm.' },
      { stepNumber: 5, title: 'Get Medical Help', description: 'Transport to emergency care.' }
    ],
    warnings: ['Never move someone with suspected spinal injury', 'Do not attempt to realign bone'],
    whenToCallEmergency: ['Suspected spinal fracture', 'Bone protruding through skin', 'Signs of shock'],
    tags: ['fracture', 'broken bone', 'splint'],
    isOfflineAvailable: true
  },
  {
    title: 'Seizure Response',
    category: 'seizures',
    description: 'Knowing how to respond to a seizure keeps the person safe.',
    severity: 'high',
    steps: [
      { stepNumber: 1, title: 'Stay Calm', description: 'Stay with the person and time the seizure.' },
      { stepNumber: 2, title: 'Protect from Injury', description: 'Cushion the head. Clear dangerous objects.', warning: 'Do NOT restrain the person' },
      { stepNumber: 3, title: 'Position Safely', description: 'Gently roll onto their side to prevent choking.', warning: 'Do NOT put anything in their mouth' },
      { stepNumber: 4, title: 'After the Seizure', description: 'Keep on side. Talk calmly to reassure.' },
      { stepNumber: 5, title: 'Monitor Recovery', description: 'Stay until fully conscious.' }
    ],
    warnings: ['NEVER put anything in the mouth', 'Do not restrain'],
    whenToCallEmergency: ['Seizure lasts longer than 5 minutes', 'Person does not regain consciousness', 'Person is injured'],
    tags: ['seizure', 'epilepsy', 'convulsion'],
    isOfflineAvailable: true
  },

  {
    title: 'Heat Stroke Treatment',
    category: 'heatstroke',
    description: 'Heat stroke is life-threatening - body temperature rises dangerously high.',
    severity: 'critical',
    steps: [
      { stepNumber: 1, title: 'Call Emergency Services', description: 'Call 911 immediately. This is life-threatening.' },
      { stepNumber: 2, title: 'Move to Cool Area', description: 'Move to a cool shaded or air-conditioned area.' },
      { stepNumber: 3, title: 'Cool the Person', description: 'Use cool water, wet cloths on neck/armpits/groin.', warning: 'Do not give fluids to unconscious person' },
      { stepNumber: 4, title: 'Remove Excess Clothing', description: 'Remove unnecessary clothing to cool down faster.' },
      { stepNumber: 5, title: 'Monitor Until Help Arrives', description: 'Keep cooling until emergency services arrive.' }
    ],
    warnings: ['Do not give aspirin for heat stroke', 'Do not use alcohol rub'],
    whenToCallEmergency: ['Temperature above 103°F', 'Confusion or unconsciousness', 'Hot, red, dry skin'],
    tags: ['heat stroke', 'hyperthermia', 'overheating'],
    isOfflineAvailable: true
  }
];

async function seedDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await FirstAidGuide.deleteMany({});
    console.log('🗑️  Cleared existing guides');

    await FirstAidGuide.insertMany(guides);
    console.log(`✅ Seeded ${guides.length} first aid guides successfully!`);
    console.log('\n📋 Guides added:');
    guides.forEach(g => console.log(`   ✓ ${g.title}`));
    console.log('\n🎉 Database ready!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedDatabase();
