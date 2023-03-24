/* eslint-disable import/extensions */
import express from 'express';
import crypto from 'crypto';
import mailchimp from '../mailchimp.js';

import {
  createEvent,
  patchEvent,
  getAllProfiles,
  getModulebyId,
  getGoogleaccount,
  getUserUsernames,
  getUserProfiles,
  getMessages,
  firebase_updateModulechildren,
} from '../controllers/controllers.js';
// import { updateDoc } from '../../client/src/api/index.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('We are live!');
});

// creates an event on google calendar
router.post('/createEvent', createEvent);

// updates an event on google calendar
router.patch('/patchEvent', patchEvent);

// gets all profiles from firebase collection "profiles"
router.get('/getAllProfiles', getAllProfiles);

// gets a module by ID, and returns that module and all of its direct children
router.get('/getModulebyId/:id/:currRole', getModulebyId);

// gets profile via google email
router.get('/getGoogleaccount/:googleAccount', getGoogleaccount);

router.get('/getUserUsernames/:users', getUserUsernames);

// gets profile via regular sign in
router.get('/getUserProfiles/:users', getUserProfiles);

// adds a module to firebase
// then adds new module to the parent's children array
router.post('/updateModulechildren', firebase_updateModulechildren);

// mailchimp routes
router.get('/mailchimp', async (req, res) => {
  try {
    const response = await mailchimp.root.getRoot();
    res.send(response);
  } catch (error) {
    console.log(`Error in mailchimp endpoint ${error.message}`);
  }
});

router.post('/mailchimp/createList', async (req, res) => {
  try {
    const response = await mailchimp.lists.createList({
      name: req.body.name,
      permission_reminder: 'permission_reminder',
      email_type_option: true,
      contact: {
        company: 'Friends of The Children',
        city: 'Portland',
        country: 'US',
        address1: '44 NE Morris St.',
        state: 'Oregon', // not required
        zip: '97212', // not required
      },
      campaign_defaults: {
        from_name: req.body.from_name,
        from_email: req.body.from_email,
        subject: 'New Admin Announcement!',
        language: 'EN_US',
      },
    });

    console.log(`Created list ${req.body.name} successfully`);
    res.status(202).json(response);
  } catch (error) {
    console.log(`Error in mailchimp createlist endpoint ${error.message}`);
    res.status(401).json(error.message);
  }
});

router.post('/mailchimp/createMergeField', async (req, res) => {
  try {
    const response = await mailchimp.lists.addListMergeField(process.env.MAILCHIMP_AUDIENCE_ID, {
      name: req.body.name,
      type: req.body.type,
    });
    console.log(`Created merge field ${req.body.name} successfully`);
    res.status(202).json(response);
  } catch (error) {
    console.log(`error generated by merge field endpoint: ${error.message}`);
    res.status(401).json(error.message);
  }
});

router.post('/mailchimp/addToList', async (req, res) => {
  try {
    const response = await mailchimp.lists.addListMember(process.env.MAILCHIMP_AUDIENCE_ID, {
      email_address: req.body.email_address,
      status: 'subscribed',
      merge_fields: {
        FNAME: req.body.firstName,
        LNAME: req.body.lastName,
        ROLE: req.body.role,
        SAREA: req.body.serviceArea,
      },
    });

    console.log(`Added to list ${process.env.MAILCHIMP_AUDIENCE_ID}`);
    res.status(202).json(response);
  } catch (error) {
    res.status(401).json(error.message);
  }
});

router.post('/mailchimp/updateList', async (req, res) => {
  // field == email or status or fname or lname or role or serviceArea
  try {
    const updatedFields = {};
    let subHash = '';

    if ('currentEmail' in req.body) {
      updatedFields.email_address = req.body.currentEmail;
      subHash = crypto.createHash('md5').update(req.body.currentEmail.toLowerCase()).digest('hex');
    } else {
      throw new Error('Request body must contain an email');
    }
    if ('status' in req.body) {
      updatedFields.status = req.body.status;
    }
    if ('newEmail' in req.body) {
      updatedFields.email_address = req.body.newEmail;
    }
    if ('firstName' in req.body || 'lastName' in req.body || 'role' in req.body || 'serviceArea' in req.body) {
      updatedFields.merge_fields = {};
      if ('lastName' in req.body) {
        updatedFields.merge_fields.LNAME = req.body.lastName;
      }
      if ('firstName' in req.body) {
        updatedFields.merge_fields.FNAME = req.body.firstName;
      }
      if ('role' in req.body) {
        updatedFields.merge_fields.ROLE = req.body.role;
      }
      if ('serviceArea' in req.body) {
        updatedFields.merge_fields.SAREA = req.body.serviceArea;
      }
    }

    console.log('updated fields:', updatedFields);

    const response = await mailchimp.lists.updateListMember(process.env.MAILCHIMP_AUDIENCE_ID, subHash, updatedFields);

    res.status(202).json(response);
  } catch (error) {
    console.log(error.message);
    res.status(401).json(error.message);
  }
});
router.get('/getMessages', getMessages);

export default router;
