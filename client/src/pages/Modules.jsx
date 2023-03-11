import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  ref, uploadBytesResumable, getDownloadURL,
} from 'firebase/storage';

import { db, storage } from './firebase';
import styles from '../styles/Modules.module.css';

function Modules({ profile }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [mentor, setMentor] = useState(false);
  const [caregiver, setCaregiver] = useState(false);
  const roles = [];
  const [modules, setModules] = useState([]);
  const { role } = profile;
  const currRole = role.toLowerCase();

  // const [selectedFile, setSelectedFile] = useState();
  const [percent, setPercent] = useState(0);
  const [link, setLink] = useState('');

  // add permissions to view module. order doesn't matter
  if (mentor) {
    roles.push('mentor');
  }
  if (caregiver) {
    roles.push('caregiver');
  }

  const getModules = () => {
    db.collection('modules').get().then((sc) => {
      const card = [];
      sc.forEach((doc) => {
        const data = doc.data();
        if (data && data.role) {
          data.id = doc.id;
          // fetching parent-level modules that we have permission to view
          if (data.parent == null && (currRole === 'admin' || data.role.includes(currRole))) {
            card.push(data);
          }
        }
      });
      setModules(card);
    });
  };

  // upload file to Firebase:
  const handleUpload = (file) => {
    console.log('target:', file.name);
    // if (!file) {
    //   alert('Please choose a file first!');
    // }
    const fileName = file.name;
    const storageRef = ref(storage, `/files/${fileName}`);
    console.log(storageRef);
    console.log();
    setLink(storageRef.fullPath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const p = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
        );

        // update progress
        setPercent(p);
      },
      (err) => console.log(err),
      () => {
        // download url
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          console.log(url);
        });
      },
    );
    // set linkstate here:
  };

  const handleChange = (e) => {
    handleUpload(e.target.files[0]); // test
  };

  const submitForm = async () => {
    const data = {
      title,
      body,
      serviceArea,
      role: roles,
      children: [],
      parent: null,
      link,
    };

    const tempId = (await db.collection('modules').add(data)).id;

    data.id = tempId;

    setModules([...modules, data]);

    setTitle('');
    setBody('');
    setServiceArea('');
    setCaregiver(false);
    setMentor(false);
  };

  // empty dependency array means getModules is only being called on page load
  useEffect(getModules);
  // useEffect(getFromFirebase, [modules]);

  if (currRole === 'admin') {
    return (
      <div>
        {modules.map((card) => (
          <div key={card.id}>
            <Link
              to="/expanded-module"
              state={{ id: card.id }}
            >
              <div className={styles.card}>
                <h1>{card.title}</h1>
              </div>
            </Link>
          </div>
        ))}
        <form action="post">
          <h1>Upload Module</h1>
          Title:
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
          Body:
          <input type="text" value={body} onChange={(e) => setBody(e.target.value)} />
          Choose a role!!
          Caregiver
          <input type="checkbox" id="caregiver" name="caregiver" checked={caregiver} onChange={(e) => setCaregiver(e.target.checked)} />
          Mentor
          <input type="checkbox" id="mentor" name="mentor" checked={mentor} onChange={(e) => setMentor(e.target.checked)} />
          Service Area:
          <input type="text" value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} />
          File:
          <input type="file" defaultValue="" onChange={handleChange} />
          <p>
            {percent}
            {' '}
            % done
          </p>
          <button type="button" onClick={submitForm}>Submit</button>

        </form>
      </div>
    );
  }
  return (
    <div>
      {modules.map((card) => (
        <div key={card.id}>
          <Link
            to="/expanded-module"
            state={{ id: card.id }}
          >
            <div className={styles.card}>
              <h1>{card.title}</h1>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}

Modules.propTypes = {
  profile: PropTypes.shape({
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    serviceArea: PropTypes.string.isRequired,
  }).isRequired,
};
export default Modules;
