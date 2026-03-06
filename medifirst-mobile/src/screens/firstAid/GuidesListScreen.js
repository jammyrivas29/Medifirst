import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { getAllGuides } from '../../api/firstAidApi';

const GUIDES_DOWNLOAD_KEY = 'medifirst_guides_downloaded';

const SEVERITY_COLORS = {
  critical: '#e74c3c', high: '#e67e22', medium: '#f39c12', low: '#27ae60',
};

const CATEGORY_META = {
  cpr:        { icon: 'heart',       color: '#e74c3c', label: 'CPR'         },
  choking:    { icon: 'warning',     color: '#e67e22', label: 'Choking'     },
  burns:      { icon: 'flame',       color: '#f39c12', label: 'Burns'       },
  bleeding:   { icon: 'bandage',     color: '#c0392b', label: 'Bleeding'    },
  fractures:  { icon: 'body',        color: '#8e44ad', label: 'Fractures'   },
  seizure:    { icon: 'pulse',       color: '#2980b9', label: 'Seizure'     },
  stroke:     { icon: 'medkit',      color: '#d35400', label: 'Stroke'      },
  heat_stroke:{ icon: 'thermometer', color: '#f39c12', label: 'Heat Stroke' },
  poison:     { icon: 'skull',       color: '#27ae60', label: 'Poisoning'   },
};

// ─── CPR steps split by audience ─────────────────────────────────────────────
export const CPR_MODES = {
  adult: {
    label: 'Adult', icon: 'person', color: '#e74c3c', bg: '#fdecea',
    ageNote: 'Ages 8 and older',
    details: ['Use 2 hands', 'Push 2 inches deep', '30 compressions : 2 breaths'],
    steps: [
      { stepNumber: 1, title: 'Check the Scene', description: 'Make sure the scene is safe for you and the victim. Look for hazards before approaching.', image: require('../../../assets/guides/cpr/step1cpr.jpg') },
      { stepNumber: 2, title: 'Check for Unresponsiveness', description: 'Check for breathing and pulse at the carotid artery next to the windpipe just below the jaw.', image: require('../../../assets/guides/cpr/cpr1.jpg') },
      { stepNumber: 3, title: 'Call Emergency Services', description: 'Call 911 or the local emergency number immediately, or ask someone nearby to call.', image: require('../../../assets/guides/cpr/cpr2.jpg') },
      { stepNumber: 4, title: 'Keep the Victim on Their Back', description: 'Ensure the victim is lying flat on their back on a firm, flat surface to allow effective compressions.', image: require('../../../assets/guides/cpr/cpr3.jpg') },
      { stepNumber: 5, title: 'Give 30 Chest Compressions', description: 'Push hard and fast in the center of the chest with 2 hands. Give 30 compressions at 100–120 per minute, at least 2 inches deep.', image: require('../../../assets/guides/cpr/cpr4.jpg') },
      { stepNumber: 6, title: 'Open the Airway', description: 'Tilt the victim\'s head back slightly and lift the chin to open the airway.', image: require('../../../assets/guides/cpr/3cpr.jpg') },
      { stepNumber: 7, title: 'Give 2 Rescue Breaths', description: 'Pinch the nose, seal your mouth over theirs, and give 2 slow breaths — each about 1 second long. Watch for chest rise.', image: require('../../../assets/guides/cpr/4cpr.jpg') },
      { stepNumber: 8, title: 'Start with 2 Rescue Breaths', description: 'After giving 30 chest compressions, give 2 rescue breaths by covering the victim\'s mouth with yours and blowing gently into it.', image: require('../../../assets/guides/cpr/5cpr.jpg') },
      { stepNumber: 9, title: 'Repeat Cycles as Needed', description: 'Continue the cycle of 30 compressions and 2 breaths until emergency help arrives or the victim shows signs of life.', image: require('../../../assets/guides/cpr/6cpr.jpg') },
    ],
  },
  child: {
    label: 'Child', icon: 'body', color: '#e67e22', bg: '#fef5ec',
    ageNote: 'Ages 1 – 7',
    details: ['Use 1 or 2 hands', 'Push 2 inches deep', '30 compressions : 2 breaths'],
    steps: [
      { stepNumber: 1, title: 'Check the Scene', description: 'Make sure the scene is safe. Look for hazards before approaching the child.', image: require('../../../assets/guides/cpr/step1cpr.jpg') },
      { stepNumber: 2, title: 'Check for Unresponsiveness', description: 'Tap the child\'s shoulder and call their name loudly. If no response, check for breathing and pulse.', image: require('../../../assets/guides/cpr/cpr1.jpg') },
      { stepNumber: 3, title: 'Call Emergency Services', description: 'Call 911 immediately, or send someone else to call so you can stay with the child.', image: require('../../../assets/guides/cpr/cpr2.jpg') },
      { stepNumber: 4, title: 'Lay Child on Their Back', description: 'Place the child flat on their back on a firm surface. Tilt their head back gently to open the airway.', image: require('../../../assets/guides/cpr/cpr3.jpg') },
      { stepNumber: 5, title: 'Give 30 Chest Compressions', description: 'Use 1 or 2 hands on the center of the chest. Push down about 2 inches at 100–120 compressions per minute.', image: require('../../../assets/guides/cpr/cpr4.jpg') },
      { stepNumber: 6, title: 'Follow the Same CPR Steps', description: 'Follow the same initial procedures as adult CPR — open airway, give rescue breaths, repeat cycles.', image: require('../../../assets/guides/cpr/2cpr.jpg') },
      { stepNumber: 7, title: 'Open the Airway', description: 'Tilt the victim\'s head back slightly and lift the chin to open the airway.', image: require('../../../assets/guides/cpr/3cpr.jpg') },
      { stepNumber: 8, title: 'Give 2 Rescue Breaths', description: 'Pinch the nose, cover the child\'s mouth with yours, and give 2 gentle breaths. Watch for chest rise.', image: require('../../../assets/guides/cpr/5cpr.jpg') },
      { stepNumber: 9, title: 'Repeat Cycles as Needed', description: 'Continue 30 compressions and 2 breaths until help arrives or the child shows signs of life.', image: require('../../../assets/guides/cpr/6cpr.jpg') },
    ],
  },
  baby: {
    label: 'Baby / Infant', icon: 'happy', color: '#8e44ad', bg: '#f5eef8',
    ageNote: 'Under 1 year old',
    details: ['Use 2 fingers only', 'Push 1.5 inches deep', '30 compressions : 2 breaths'],
    steps: [
      { stepNumber: 1, title: 'CPR for Infants', description: 'For infants under 1 year old, use two fingers for chest compressions and cover the infant\'s mouth and nose with your mouth for rescue breaths.', image: require('../../../assets/guides/cpr/7cpr.jpg') },
      { stepNumber: 2, title: 'Position the Baby Between Your Forearms', description: 'Position the infant on their back between your forearms, with the infant\'s head slightly lower than their chest.', image: require('../../../assets/guides/cpr/8cpr.jpg') },
      { stepNumber: 3, title: 'Deliver Back Blows if Choking', description: 'If the infant is choking, deliver five sharp back blows between their shoulder blades with the heel of your hand.', image: require('../../../assets/guides/cpr/9cpr.jpg') },
      { stepNumber: 4, title: 'Place the Baby on Their Back', description: 'Ensure the infant is lying flat on their back to maintain an open airway.', image: require('../../../assets/guides/cpr/10cpr.jpg') },
      { stepNumber: 5, title: 'Position Your Fingers on the Chest', description: 'Place 2 fingers in the center of the baby\'s chest, just below the nipple line.', image: require('../../../assets/guides/cpr/11cpr.jpg') },
      { stepNumber: 6, title: 'Gently Compress the Chest', description: 'Compress the chest about 1.5 inches at a rate of 100–120 compressions per minute. Be gentle but firm.', image: require('../../../assets/guides/cpr/12cpr.jpg') },
      { stepNumber: 7, title: 'Cover the Baby\'s Nose and Mouth', description: 'Cover the baby\'s nose and mouth with your mouth and give two quick, gentle breaths — just enough to see the chest rise.', image: require('../../../assets/guides/cpr/13cpr.jpg') },
      { stepNumber: 8, title: 'Repeat the Cycle as Needed', description: 'Continue the cycle of compressions and breaths until emergency help arrives or the victim shows signs of life.', image: require('../../../assets/guides/cpr/14cpr.jpg') },
    ],
  },
};

const LOCAL_GUIDES = [
  {
    _id: 'local_cpr',
    title: 'CPR (Cardiopulmonary Resuscitation)',
    description: 'CPR is a lifesaving technique useful in emergencies where someone\'s breathing or heartbeat has stopped. Select the correct method for the victim\'s age.',
    category: 'cpr', severity: 'critical', isOfflineAvailable: true,
    hasCprModes: true, cprModes: CPR_MODES,
    warnings: ['Do not stop CPR unless emergency services take over', 'Compressions may break ribs — this is normal and acceptable', 'Do not give rescue breaths if untrained — hands-only CPR is acceptable'],
    whenToCallEmergency: ['Person is unresponsive', 'Person is not breathing normally', 'Person has no pulse'],
  },
  {
    _id: 'local_choking',
    title: 'Choking — Heimlich Maneuver',
    description: 'Choking occurs when a foreign object blocks the throat or windpipe. Quick action is critical.',
    category: 'choking', severity: 'critical', isOfflineAvailable: true,
    steps: [
      { stepNumber: 1, title: 'Assess the situation', description: 'Determine if the person is truly choking and needs immediate help.', image: require('../../../assets/guides/choking/1.jpg') },
      { stepNumber: 2, title: 'Ask the person, "Are you choking?"', description: 'If they can speak, encourage them to cough. If they cannot speak, they are likely choking.', image: require('../../../assets/guides/choking/2.jpg') },
      { stepNumber: 3, title: 'Administer first-aid', description: 'If the person is choking, administer first-aid as appropriate.', image: require('../../../assets/guides/choking/3.jpg') },
      { stepNumber: 4, title: 'Give Back Blows', description: 'If the person is choking, give back blows as appropriate.', image: require('../../../assets/guides/choking/4.jpg') },
      { stepNumber: 5, title: 'Administer abdominal thrusts', description: 'If the person is choking, administer abdominal thrusts as appropriate.', image: require('../../../assets/guides/choking/5.jpg') },
      { stepNumber: 6, title: 'Modify the Heimlich maneuver', description: 'Adjust the Heimlich maneuver based on the person\'s size and condition.', image: require('../../../assets/guides/choking/6.jpg') },
      { stepNumber: 7, title: 'Make sure the object is completely gone', description: 'Ensure the object is completely dislodged before proceeding.', image: require('../../../assets/guides/choking/7.jpg') },
      { stepNumber: 8, title: 'Check to see if normal breathing has returned.', description: 'If the person is choking, check to see if normal breathing has returned.', image: require('../../../assets/guides/choking/8.jpg') },
      { stepNumber: 9, title: 'Administer help if the person falls unconscious', description: 'If the person falls unconscious, administer help as appropriate.', image: require('../../../assets/guides/choking/9.jpg') },
      { stepNumber: 10, title: 'Consult a physician', description: 'Consult a physician if the person continues to have difficulty breathing or if you have any concerns about their condition.', image: require('../../../assets/guides/choking/10.jpg') },
    ],
    warnings: ['Never do blind finger sweeps in the mouth', 'For pregnant women or obese individuals, use chest thrusts instead', 'Do not slap a choking person on the back while upright — bend them forward first'],
    whenToCallEmergency: ['Person cannot breathe, speak, or cough', 'Person loses consciousness', 'Object cannot be dislodged after several attempts'],
  },
  {
    _id: 'local_burns',
    title: 'Burns — First Aid Treatment',
    description: 'Burns are injuries caused by heat, chemicals, electricity, or radiation. Proper treatment prevents infection.',
    category: 'burns', severity: 'high', isOfflineAvailable: true,
    steps: [
      { stepNumber: 1, title: 'Ensure Safety', description: 'Remove the person from the source of the burn. For chemical burns, remove contaminated clothing carefully.', image: require('../../../assets/guides/burns/burns1.jpg') },
      { stepNumber: 2, title: 'Cool the Burn', description: 'Apply a cool, moist towel over the burned area. Do not use ice or cold water — this can cause hypothermia.', image: require('../../../assets/guides/burns/burns2.jpg') },
      { stepNumber: 3, title: 'Remove Chemical Irritants', description: 'If caused by chemicals, run the area under cool water. Do not attempt home remedies on a chemical burn.', image: require('../../../assets/guides/burns/burns3.jpg') },
      { stepNumber: 4, title: 'Elevate the Burn', description: 'Elevate the burned area above heart level if possible. Cover with clean, non-fluffy material like plastic wrap.', image: require('../../../assets/guides/burns/burns4.jpg') },
      { stepNumber: 5, title: 'Watch for Shock', description: 'Watch for weak pulse, low blood pressure, clammy skin, disorientation. Get medical attention immediately.', image: require('../../../assets/guides/burns/burns5.jpg') },
    ],
    warnings: ['Never use butter, toothpaste, or ice on burns', 'Do not remove clothing stuck to the burn', 'Do not use fluffy cotton material to cover burns'],
    whenToCallEmergency: ['Burn is larger than 3 inches', 'Burn involves face, hands, feet, or genitals', 'Burn is deep, white, or charred (3rd degree)', 'Chemical or electrical burn'],
  },
  {
    _id: 'local_bleeding',
    title: 'Severe Bleeding — Wound Care',
    description: 'Uncontrolled bleeding can be life-threatening. Acting quickly to control blood loss is essential.',
    category: 'bleeding', severity: 'critical', isOfflineAvailable: true,
    steps: [
      { stepNumber: 1, title: 'Rinse the Cut with Water', description: 'Running water will both clean the wound and help stop the bleeding. Run cool water over the cut to constrict blood vessels.', image: require('../../../assets/guides/bleeding/bleeding1.jpg') },
      { stepNumber: 2, title: 'Apply Pressure', description: 'After cleaning, apply pressure with a clean cloth or gauze. Hold for several minutes without removing.', image: require('../../../assets/guides/bleeding/bleeding2.jpg') },
      { stepNumber: 3, title: 'Try a Styptic Pencil', description: 'Rub the pencil over the skin. The mineral astringents will stop bleeding. It may sting briefly.', image: require('../../../assets/guides/bleeding/bleeding3.jpg') },
      { stepNumber: 4, title: 'Add Petroleum Jelly', description: 'Apply a small smear of petroleum jelly to minor cuts to block blood flow and allow clotting.', image: require('../../../assets/guides/bleeding/bleeding4.jpg') },
      { stepNumber: 5, title: 'Apply Antiperspirant', description: 'Aluminum chloride in deodorant works as an astringent to stop blood flow.', image: require('../../../assets/guides/bleeding/bleeding5.jpg') },
      { stepNumber: 6, title: 'Dab on Listerine', description: 'Listerine can disinfect your cut and help stop blood flow.', image: require('../../../assets/guides/bleeding/bleeding6.jpg') },
      { stepNumber: 7, title: 'Use an Alum Block', description: 'Alum blocks are a traditional remedy for stopping bleeding.', image: require('../../../assets/guides/bleeding/bleeding7.jpg') },
      { stepNumber: 8, title: 'Apply White Vinegar', description: 'The astringent properties of vinegar disinfect and clot small cuts.', image: require('../../../assets/guides/bleeding/bleeding8.jpg') },
      { stepNumber: 9, title: 'Try Witch Hazel', description: 'Witch hazel acts as a natural astringent great for clotting small cuts.', image: require('../../../assets/guides/bleeding/bleeding9.jpg') },
      { stepNumber: 10, title: 'Use Cornstarch', description: 'Sprinkle cornstarch onto the cut. Lightly press the powder to expedite clotting, then rinse off.', image: require('../../../assets/guides/bleeding/bleeding10.jpg') },
      { stepNumber: 11, title: 'Last Resort: Spiderweb', description: 'Spiderwebs have been used historically to stop bleeding. Gently place over the cut and apply pressure.', image: require('../../../assets/guides/bleeding/bleeding11.jpg') },
    ],
    warnings: ['Do not remove objects embedded in wounds', 'Do not remove a tourniquet once applied', 'Watch for signs of shock: pale skin, rapid breathing, confusion'],
    whenToCallEmergency: ['Bleeding does not stop after 10 minutes of pressure', 'Blood is spurting from the wound', 'Person shows signs of shock', 'Wound is deep or has embedded object'],
  },
  {
    _id: 'local_fractures',
    title: 'Fractures — Bone Injury Care',
    description: 'A fracture is a broken bone. Proper immobilization prevents further injury until medical help arrives.',
    category: 'fractures', severity: 'high', isOfflineAvailable: true,
    steps: [
      { stepNumber: 1, title: 'Recognize the symptoms of a fracture in your foot.', description: 'Look for signs like severe pain, swelling, deformity, inability to bear weight, or visible bone.', image: require('../../../assets/guides/fractures/fracture1.jpg') },
      { stepNumber: 2, title: 'Foot fracture symptoms', description: 'Other symptoms include bruising, numbness, and inability to move the toes.', image: require('../../../assets/guides/fractures/fracture2.jpg') },
      { stepNumber: 3, title: 'Take some acetaminophen', description: 'Take over-the-counter pain medication like acetaminophen to manage pain.', image: require('../../../assets/guides/fractures/fracture3.jpg') },
      { stepNumber: 4, title: 'Go see your personal physician', description: 'See a doctor for proper diagnosis and treatment.', image: require('../../../assets/guides/fractures/fracture4.jpg') },
      { stepNumber: 5, title: 'Method 2', description: 'Keep the person calm and still until help arrives.', image: require('../../../assets/guides/fractures/fracture5.jpg') },
      { stepNumber: 6, title: 'Assess the fracture', description: 'Determine if the fracture is open (bone visible through skin) or closed (skin intact).', image: require('../../../assets/guides/fractures/fracture6.jpg') },
      { stepNumber: 7, title: 'Stop any bleeding and immobilize the fracture', description: 'Apply direct pressure to stop bleeding and immobilize the area with a splint or sling.', image: require('../../../assets/guides/fractures/fracture7.jpg') },
      { stepNumber: 8, title: 'Head to the emergency room', description: 'Get the person to a hospital or call emergency services for further evaluation and treatment.', image: require('../../../assets/guides/fractures/fracture8.jpg') },
      { stepNumber: 9, title: 'Get your foot X-rayed.', description: 'Get an X-ray to assess the extent of the fracture.', image: require('../../../assets/guides/fractures/fracture9.jpg') },
      { stepNumber: 10, title: 'Follow the treatment plan', description: 'Follow the prescribed treatment plan and attend all follow-up appointments.', image: require('../../../assets/guides/fractures/fracture10.jpg') },
    ],
    warnings: ['Never try to straighten a broken bone', 'Do not move a person with suspected spinal injury', 'Open fractures are medical emergencies'],
    whenToCallEmergency: ['Suspected spinal, neck, or head injury', 'Bone is visible through skin', 'Limb is numb, cold, or bluish below fracture', 'Person is unconscious'],
  },
  {
    _id: 'local_heatstroke',
    title: 'Heat Stroke — Emergency Response',
    description: 'Heat stroke is a serious condition that occurs when the body overheats and cannot cool itself properly. Immediate action is required.',
    category: 'heat_stroke', severity: 'high', isOfflineAvailable: true,
    steps: [
      { stepNumber: 1, title: 'Stay in the shade', description: 'Move the person to a shaded area and help them rest.', image: require('../../../assets/guides/heat_stroke/hs1.jpg') },
      { stepNumber: 2, title: 'Find a cool indoor space', description: 'If your home gets too hot, move the person to a cooler indoor space.', image: require('../../../assets/guides/heat_stroke/hs2.jpg') },
      { stepNumber: 3, title: 'Stock up on emergency supplies', description: 'Keep emergency supplies like water, ice packs, and a fan nearby.', image: require('../../../assets/guides/heat_stroke/hs3.jpg') },
      { stepNumber: 4, title: 'Plan ahead for medical care', description: 'Identify nearby medical facilities and keep emergency contact information handy.', image: require('../../../assets/guides/heat_stroke/hs4.jpg') },
      { stepNumber: 5, title: 'Call emergency services if needed', description: 'If the person is unconscious, confused, or has a high body temperature, call 911 immediately.', image: require('../../../assets/guides/heat_stroke/hs5.jpg') },
    ],
    warnings: ['Never put anything in the mouth of a person having a heat stroke', 'Do not give water or food until fully conscious', 'Never leave the person alone during or right after a heat stroke'],
    whenToCallEmergency: ['Body temperature is over 104°F (40°C)', 'Person is unconscious or confused', 'Person has a heat stroke or difficulty breathing', 'Person is pregnant or diabetic'],
  },
  {
    _id: 'local_seizure',
    title: 'Seizure — Emergency Response',
    description: 'A seizure is a sudden electrical disturbance in the brain. Knowing how to respond safely can prevent injury.',
    category: 'seizure', severity: 'high', isOfflineAvailable: true,
    steps: [
      { stepNumber: 1, title: 'Protecting the Person from Harm', description: 'Protect the person from injury during the seizure. Remove nearby hard or sharp objects.', image: require('../../../assets/guides/seizures/seizure1.jpg') },
      { stepNumber: 2, title: 'Reduce the risk of injury by checking the area', description: 'Clear the area of any hard or sharp objects that could cause injury.', image: require('../../../assets/guides/seizures/seizure2.jpg') },
      { stepNumber: 3, title: 'Place something soft under the person\'s head.', description: 'Place a folded towel, jacket, or pillow under the person\'s head to protect it.', image: require('../../../assets/guides/seizures/seizure3.jpg') },
      { stepNumber: 4, title: 'Stay clear of the person', description: 'Do not touch the person during the seizure. Stay nearby to monitor and assist if needed.', image: require('../../../assets/guides/seizures/seizure4.jpg') },
      { stepNumber: 5, title: 'Time the Seizure', description: 'Note when the seizure starts and ends. More than 5 minutes is a medical emergency.', image: require('../../../assets/guides/seizures/seizure5.jpg') },
      { stepNumber: 6, title: 'Method 2 Calling Emergency Services', description: 'If the seizure lasts more than 5 minutes, call 911 immediately.', image: require('../../../assets/guides/seizures/seizure6.jpg') },
      { stepNumber: 7, title: 'Call emergency services if the seizure lasts more than 5 minutes.', description: 'If the seizure lasts more than 5 minutes, call 911 immediately.', image: require('../../../assets/guides/seizures/seizure7.jpg') },
    ],
    warnings: ['Never put anything in the mouth of a person having a seizure', 'Do not give water or food until fully conscious', 'Never leave the person alone during or right after a seizure'],
    whenToCallEmergency: ['Seizure lasts more than 5 minutes', 'Person does not regain consciousness', 'Person is injured during the seizure', 'It is a first seizure', 'Person is pregnant or diabetic'],
  },
  {
    _id: 'local_stroke',
    title: 'Stroke — Emergency Care',
    description: 'A stroke occurs when blood flow to part of the brain is interrupted or reduced, preventing brain tissue from getting oxygen and nutrients. Immediate medical attention is crucial.',
    category: 'stroke', severity: 'critical', isOfflineAvailable: true,
    steps: [
      { stepNumber: 1, title: 'Understand the difference between a stroke and a mini-stroke', description: 'Mini-strokes, also called transient ischemic attacks, occur when your brain gets less blood than normal. They can last from a few minutes up to a day.', image: require('../../../assets/guides/stroke/stroke.jpg') },
      { stepNumber: 2, title: 'Look for two or more symptoms of a stroke', description: 'Common stroke symptoms include sudden numbness, weakness, confusion, difficulty speaking or understanding, vision problems, trouble walking, and severe headache.', image: require('../../../assets/guides/stroke/stroke01.jpg') },
      { stepNumber: 3, title: 'Do the F.A.S.T test.', description: 'Face drooping, A: Arm weakness, S: Speech difficulty, T: Time to call 911.', image: require('../../../assets/guides/stroke/stroke02.jpg') },
      { stepNumber: 4, title: 'Method 2 Medical Attention for the Stroke Victim', description: 'Once emergency services are called, the person should be taken to the hospital for immediate medical attention.', image: require('../../../assets/guides/stroke/stroke1.jpg') },
      { stepNumber: 5, title: 'Allow the doctor to do tests and a check up', description: 'The doctor will perform necessary tests and examinations to determine the type and severity of the stroke.', image: require('../../../assets/guides/stroke/stroke2.jpg') },
      { stepNumber: 6, title: 'Discuss treatment options with the doctor', description: 'The doctor will discuss treatment options such as medications or surgical procedures based on the patient\'s condition.', image: require('../../../assets/guides/stroke/stroke3.jpg') },
    ],
    warnings: ['Do not give aspirin or blood thinners unless directed by a doctor', 'Do not give food or drink to an unconscious or confused person', 'Do not delay seeking medical attention'],
    whenToCallEmergency: ['Person shows signs of stroke (F.A.S.T symptoms)', 'Person is unconscious or unresponsive', 'Person has severe headache with no known cause', 'Person has sudden vision changes or difficulty speaking'],
  },
  {
    _id: 'local_poison',
    title: 'Poisoning — Emergency Care',
    description: 'Poisoning is a medical emergency requiring immediate attention. Follow these steps to provide initial care.',
    category: 'poison', severity: 'critical', isOfflineAvailable: true,
    steps: [
      { stepNumber: 1, title: 'Getting Immediate Help', description: 'If you suspect poisoning, call 911 or Poison Control (1-800-222-1222) immediately.', image: require('../../../assets/guides/poison/poison1.jpg') },
      { stepNumber: 2, title: 'Get immediate help if you think someone poisoned themself intentionally', description: 'If you suspect intentional poisoning, call 911 immediately and do not leave the person alone.', image: require('../../../assets/guides/poison/poison2.jpg') },
      { stepNumber: 3, title: 'Contact Poison Control if there are no symptoms', description: 'If the person is conscious and alert, contact Poison Control for guidance even if there are no symptoms.', image: require('../../../assets/guides/poison/poison3.jpg') },
      { stepNumber: 4, title: 'Provide as much information as you can to the medical professionals.', description: 'Tell them what substance was ingested, inhaled, or absorbed, and when it happened.', image: require('../../../assets/guides/poison/poison4.jpg') },
      { stepNumber: 5, title: 'Accompany the person while they get medical care if you can', description: 'Stay with the person until they receive medical care and provide any necessary information to medical staff.', image: require('../../../assets/guides/poison/poison5.jpg') },
    ],
    warnings: ['Never induce vomiting unless told to by Poison Control', 'Do not give anything to eat or drink', 'Do not leave the person alone'],
    whenToCallEmergency: ['Person is unconscious or unresponsive', 'Person is having seizures', 'Severe difficulty breathing', 'Unknown substance was ingested'],
  },
];

export default function GuidesListScreen({ navigation, route }) {
  const { user } = useSelector((state) => state.auth);
  const isGuest  = !user?.firstName;

  // ── category from route — null/undefined = show ALL ──────────────────────
  const routeCategory = route.params?.category ?? null;

  const [allGuides, setAllGuides]         = useState([]);
  const [displayGuides, setDisplayGuides] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [noInternet, setNoInternet]       = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // Re-fetch + clear search whenever the category param changes
  useEffect(() => {
    setSearchQuery('');
    fetchGuides();
  }, [routeCategory]);

  // Re-filter whenever allGuides or search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setDisplayGuides(allGuides);
    } else {
      const q = searchQuery.toLowerCase().trim();
      setDisplayGuides(
        allGuides.filter(g =>
          g.title?.toLowerCase().includes(q) ||
          g.description?.toLowerCase().includes(q) ||
          g.category?.toLowerCase().includes(q) ||
          g.severity?.toLowerCase().includes(q)
        )
      );
    }
  }, [allGuides, searchQuery]);

  const fetchGuides = async () => {
    setLoading(true);
    setNoInternet(false);

    // If user previously downloaded guides, always serve local — no network needed
    try {
      const downloaded = await AsyncStorage.getItem(GUIDES_DOWNLOAD_KEY);
      if (downloaded === 'true') {
        loadLocalGuides();
        setLoading(false);
        return;
      }
    } catch (_) {}

    // Check real connectivity before hitting the API
    const netState = await NetInfo.fetch();
    const isConnected = netState.isConnected && netState.isInternetReachable !== false;

    if (!isConnected) {
      setNoInternet(true);
      loadLocalGuides();
      setLoading(false);
      return;
    }

    try {
      const data = await getAllGuides(routeCategory ? { category: routeCategory } : {});
      if (data?.guides?.length > 0) {
        const list = routeCategory
          ? data.guides.filter(g => g.category?.toLowerCase() === routeCategory.toLowerCase())
          : data.guides;
        setAllGuides(list);
      } else {
        loadLocalGuides();
      }
    } catch (err) {
      // Double-check connectivity on error
      const netCheck = await NetInfo.fetch();
      const stillOnline = netCheck.isConnected && netCheck.isInternetReachable !== false;
      setNoInternet(!stillOnline);
      loadLocalGuides();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalGuides = () => {
    const list = routeCategory
      ? LOCAL_GUIDES.filter(g => g.category?.toLowerCase() === routeCategory.toLowerCase())
      : LOCAL_GUIDES;
    setAllGuides(list);
  };

  const showOfflineBanner = noInternet;
  const catMeta = routeCategory ? CATEGORY_META[routeCategory] : null;

  // ── Guide card ────────────────────────────────────────────────────────────
  const renderGuide = ({ item }) => {
    const meta = CATEGORY_META[item.category] || { icon: 'medical', color: '#999' };
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('GuideDetail', {
          guideId: item._id,
          title: item.title,
          localGuide: item,
        })}
        activeOpacity={0.8}
      >
        <View style={[styles.severityBar, { backgroundColor: SEVERITY_COLORS[item.severity] || '#999' }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconDot, { backgroundColor: meta.color + '18' }]}>
              <Ionicons name={meta.icon} size={14} color={meta.color} />
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <View style={[styles.badge, { backgroundColor: SEVERITY_COLORS[item.severity] || '#999' }]}>
              <Text style={styles.badgeText}>{item.severity?.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

          <View style={styles.cardFooter}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{item.category?.toUpperCase()}</Text>
            </View>

            {item.hasCprModes ? (
              <>
                <View style={[styles.cprChip, { backgroundColor: '#fdecea', borderColor: '#f5c6c3' }]}>
                  <Ionicons name="person" size={10} color="#e74c3c" />
                  <Text style={[styles.cprChipText, { color: '#e74c3c' }]}>Adult</Text>
                </View>
                <View style={[styles.cprChip, { backgroundColor: '#fef5ec', borderColor: '#f9d9bc' }]}>
                  <Ionicons name="body" size={10} color="#e67e22" />
                  <Text style={[styles.cprChipText, { color: '#e67e22' }]}>Child</Text>
                </View>
                <View style={[styles.cprChip, { backgroundColor: '#f5eef8', borderColor: '#dbbfee' }]}>
                  <Ionicons name="happy" size={10} color="#8e44ad" />
                  <Text style={[styles.cprChipText, { color: '#8e44ad' }]}>Baby</Text>
                </View>
              </>
            ) : (
              <View style={styles.stepsTag}>
                <Ionicons name="list" size={11} color="#2980b9" />
                <Text style={styles.stepsText}>{item.steps?.length || 0} Steps</Text>
              </View>
            )}

            {item.isOfflineAvailable && (
              <View style={styles.offlineTag}>
                <Ionicons name="checkmark-circle" size={12} color="#27ae60" />
                <Text style={styles.offlineText}>Offline</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#e74c3c" />
      <Text style={styles.loadingText}>Loading guides...</Text>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* ── Offline banner ── */}
      {showOfflineBanner && (
        <View style={styles.offlineBanner}>
          <Ionicons name="wifi-outline" size={16} color="#856404" />
          <Text style={styles.offlineBannerText}>
            No internet connection — showing downloaded guides.
          </Text>
        </View>
      )}

      {/* ── Active category filter pill (only when a category is selected) ── */}
      {catMeta && (
        <View style={styles.filterBar}>
          <View style={[styles.filterPill, { backgroundColor: catMeta.color + '18', borderColor: catMeta.color + '55' }]}>
            <Ionicons name={catMeta.icon} size={13} color={catMeta.color} />
            <Text style={[styles.filterPillText, { color: catMeta.color }]}>{catMeta.label}</Text>
          </View>
          {/* Tap "Show All" → clears category param → list shows all guides again */}
          <TouchableOpacity
            style={styles.showAllBtn}
            onPress={() => navigation.setParams({ category: null })}
          >
            <Ionicons name="apps-outline" size={13} color="#666" />
            <Text style={styles.showAllText}>Show All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Search bar ── */}
      <View style={[styles.searchWrap, searchFocused && styles.searchWrapFocused]}>
        <Ionicons name="search" size={17} color={searchFocused ? '#e74c3c' : '#bbb'} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search guides, topics, categories…"
          placeholderTextColor="#bbb"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={17} color="#bbb" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Results count row ── */}
      <View style={styles.resultRow}>
        <Text style={styles.resultCount}>
          {searchQuery.trim()
            ? `${displayGuides.length} result${displayGuides.length !== 1 ? 's' : ''} for "${searchQuery.trim()}"`
            : `${displayGuides.length} guide${displayGuides.length !== 1 ? 's' : ''}`
          }
        </Text>
        {searchQuery.trim() && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.resultClear}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Guide list ── */}
      <FlatList
        data={displayGuides}
        keyExtractor={(item) => item._id}
        renderItem={renderGuide}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconBox}>
              <Ionicons name={searchQuery.trim() ? 'search-outline' : 'book-outline'} size={40} color="#ddd" />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery.trim() ? 'No results found' : 'No guides available'}
            </Text>
            <Text style={styles.emptyDesc}>
              {searchQuery.trim()
                ? 'Try "CPR", "burns", "choking" or another topic.'
                : 'Guides will appear here once loaded.'
              }
            </Text>
            {searchQuery.trim() && (
              <TouchableOpacity style={styles.emptyClearBtn} onPress={() => setSearchQuery('')}>
                <Text style={styles.emptyClearBtnText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  offlineBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff3cd', paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#ffc107' },
  offlineBannerText: { fontSize: 12, color: '#856404', flex: 1, lineHeight: 17 },

  // ── Category filter bar ──
  filterBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 2 },
  filterPill:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
  filterPillText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  showAllBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  showAllText:    { fontSize: 12, color: '#666', fontWeight: '600' },

  // ── Search bar ──
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', marginHorizontal: 14, marginTop: 12, marginBottom: 4,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1.5, borderColor: '#ececec',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  searchWrapFocused: { borderColor: '#e74c3c', elevation: 4 },
  searchInput:       { flex: 1, fontSize: 14, color: '#1a1a2e', paddingVertical: 0 },

  resultRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 6 },
  resultCount: { fontSize: 11, color: '#aaa', fontWeight: '600' },
  resultClear: { fontSize: 11, color: '#e74c3c', fontWeight: '700' },

  list: { padding: 12, paddingTop: 6 },

  card:        { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, elevation: 2, overflow: 'hidden', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  severityBar: { width: 6, alignSelf: 'stretch' },
  cardContent: { flex: 1, padding: 14 },
  cardHeader:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  cardIconDot: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 1, flexShrink: 0 },
  cardTitle:   { fontSize: 14, fontWeight: '700', color: '#1a1a2e', flex: 1 },
  badge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, flexShrink: 0 },
  badgeText:   { color: '#fff', fontSize: 10, fontWeight: '800' },
  cardDesc:    { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 8 },

  cardFooter:  { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  categoryTag: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryText:{ fontSize: 10, color: '#666', fontWeight: '700' },
  stepsTag:    { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#e8f4fb', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  stepsText:   { fontSize: 10, color: '#2980b9', fontWeight: '700' },
  offlineTag:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  offlineText: { fontSize: 11, color: '#27ae60', fontWeight: '600' },
  cprChip:     { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  cprChipText: { fontSize: 10, fontWeight: '700' },

  emptyWrap:         { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIconBox:      { width: 72, height: 72, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  emptyTitle:        { fontSize: 16, fontWeight: '800', color: '#ccc', marginBottom: 6 },
  emptyDesc:         { fontSize: 13, color: '#bbb', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  emptyClearBtn:     { backgroundColor: '#e74c3c', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  emptyClearBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 10, color: '#666', fontSize: 16 },
});