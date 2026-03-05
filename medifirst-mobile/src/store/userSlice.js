import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: { profile: null, medicalProfile: null, emergencyContacts: [] },
  reducers: {
    setProfile: (state, action) => { state.profile = action.payload; },
    setMedicalProfile: (state, action) => { state.medicalProfile = action.payload; },
    setEmergencyContacts: (state, action) => { state.emergencyContacts = action.payload; },
    clearUser: (state) => { state.profile = null; state.medicalProfile = null; state.emergencyContacts = []; }
  }
});

export const { setProfile, setMedicalProfile, setEmergencyContacts, clearUser } = userSlice.actions;
export default userSlice.reducer;
