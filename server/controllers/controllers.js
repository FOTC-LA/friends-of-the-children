// code functionalities for all the api routes
import { createRequire } from 'module';
import {
  collection, addDoc, arrayUnion, updateDoc, doc,
} from 'firebase/firestore';
// eslint-disable-next-line import/extensions
import { db } from '../firebase.js';

// import google api
const require = createRequire(import.meta.url);
const { google } = require('googleapis');

// fotc google auth information
const {
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL, REFRESH_TOKEN,
} = process.env;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URL,
);

// inserts an event to google calendar
const createEvent = async (req, res) => {
  try {
    // obtain data from client side
    const {
      title, description, location, attachments, start, end,
    } = req.body;
    // set required auth credentials to use gcal api
    oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
    const calendar = google.calendar('v3');
    // call gcal api's "insert" method w valid json object
    const response = await calendar.events.insert({
      auth: oauth2Client,
      calendarId: 'primary',
      supportsAttachments: true,
      requestBody: {
        summary: title,
        description,
        location,
        attachments,
        start: {
          dateTime: new Date(start),
        },
        end: {
          dateTime: new Date(end),
        },
      },
    });
    // promise chain to send response back to client
    res.status(202).json(response.data);
  } catch (error) {
    res.status(400).json(error);
  }
};

// updates gcal event without modifying any unspecified event properties (requires eventID)
const patchEvent = async (req, res) => {
  try {
    const { id, start, end } = req.body;
    oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
    const calendar = google.calendar('v3');
    // call gcal api's "patch" method
    const response = await calendar.events.patch({
      auth: oauth2Client,
      calendarId: 'primary',
      eventId: id,
      requestBody: {
        start: {
          dateTime: start,
          date: null,
        },
        end: {
          dateTime: end,
          date: null,
        },
      },
    });
    res.status(202).json(response.data);
  } catch (error) {
    res.status(400).json(error);
  }
};

// returns an array of all existing user profiles
const getAllProfiles = async (req, res) => {
  try {
    // await user profile data from firebase
    const sc = await db.collection('profiles').get();
    const profiles = [];
    // push each profile into response array
    sc.forEach((dc) => {
      const data = dc.data();
      data.id = dc.id;
      profiles.push(data);
    });
    res.status(202).json(profiles);
  } catch (error) {
    res.status(400).json(error);
  }
};

// creates a child module, then adds its id to its parent's 'children' field
const updateModuleChildren = async (req, res) => {
  try {
    // pass in parent id and child (new module) data from frontend
    const { id, data } = req.body;
    // create new module in firebase
    const docRef = await addDoc(collection(db, 'modules'), data);
    // get parent module and update its children array w new id
    const moduleRef = doc(db, 'modules', id);
    await updateDoc(moduleRef, {
      children: arrayUnion(docRef.id),
    });
    res.status(200).json('success');
  } catch (error) {
    res.status(400).json(error);
  }
};

// returns a module's data and a filtered array of its children (by role)
const getModulebyId = async (req, res) => {
  try {
    const { id, currRole } = req.params;
    const childrenArray = [];
    let moduleData;
    await db.collection('modules').doc(id).get().then(async (sc) => {
      moduleData = sc.data();
      // filter children modules by role, push to childrenArray
      await Promise.all(moduleData.children.map(async (child) => {
        const snap = await db.collection('modules').doc(child).get();
        const childData = snap.data();
        if (currRole === 'admin' || childData.role.includes(currRole)) {
          const friend = {
            id: child, title: childData.title, role: childData.role,
          };
          childrenArray.push(friend);
        }
      }));
    });
    res.status(202).json({ data: moduleData, childrenArray });
  } catch (error) {
    res.status(400).json(error);
  }
};

// finds a matching profile in firebase, given a google account email
const getGoogleaccount = async (req, res) => {
  try {
    // gets google account email from route parameter (check /routes)
    const { googleAccount } = req.params;
    // returns data in firebase 'profiles' that matches email
    let googleData;
    await db.collection('profiles').where('email', '==', googleAccount).get().then(async (sc) => {
      sc.docs.forEach(async (dc) => {
        const data = await dc.data();
        data.id = dc.id;
        googleData = data;
      });
    });
    // error message if user doesn't exist (when data is undefined)
    if (googleData === undefined) {
      res.status(400).json('no existing user!');
    }
    res.status(202).json(googleData);
  } catch (error) {
    res.status(400).json(error);
  }
};

// checking if the username already exists in database (new user signing up)
const getUserUsernames = async (req, res) => {
  try {
    const usernames = [];

    db.collection('profiles').get().then((sc) => {
      sc.forEach((doc) => {
        const data = doc.data();
        if (data && data.username) {
          data.id = doc.id;
          usernames.push(data.username);
        }
      });
      // error message if user doesn't exist (when data is undefined)
      // TODO: this might not be needed, since the context of this is that there
      // SHOULDN'T be any existing usernames ==> not an error
      if (usernames.length() === 0) {
        res.status(400).json('no existing user!');
      }
      res.status(202).json(usernames);
    });
  } catch (error) {
    res.status(400).json(error);
  }
};

// returns all user profiles in database (reducing Firebase calls)
const getUserProfiles = async (req, res) => {
  try {
    const profiles = [];

    db.collection('profiles').get().then((sc) => {
      sc.forEach((doc) => {
        const data = doc.data();
        if (data && data.role) {
          data.id = doc.id;
          profiles.push(data);
        }
      });
      // if there are no existing users in database
      if (profiles.length() === 0) {
        res.status(400).json('no existing users!');
      }
      res.status(202).json(profiles);
    });
  } catch (error) {
    res.status(400).json(error);
  }
};

const getMessages = async (req, res) => {
  try {
    const message = [];
    await db.collection('messages').get().then((sc) => {
      sc.forEach((dc) => {
        const dat = dc.data();
        dat.id = dc.id;
        message.push(dat);
      });
      // sort in reverse chronological order (i.e. newest at first)
      message.sort((a, b) => {
        if (a.date < b.date) {
          return -1;
        }
        if (a.date > b.date) {
          return 1;
        }
        return 0;
      });
      res.status(202).json(message);
    });
  } catch (error) {
    res.status(400).json(error);
  }
};

export {
  createEvent,
  patchEvent,
  getAllProfiles,
  getModulebyId,
  getGoogleaccount,
  getUserUsernames,
  getUserProfiles,
  getMessages,
  updateModuleChildren,
};
