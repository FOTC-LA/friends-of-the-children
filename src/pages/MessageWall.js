import React, { useState } from 'react';
import { app, db } from './firebase';
import Message from '../components/Message';

function MessageWall() {
  const [title, setTitle] = useState();
  const [body, setBody] = useState();
  const [serviceArea, setServiceArea] = useState();
  const [mentor, setMentor] = useState();
  const [caregiver, setCaregiver] = useState();
  const target = [];
  const pinned = false;
  const myTimestamp = app.firebase.firestore.Timestamp.fromDate(new Date());
  const messages = [];

  if (mentor) {
    target.push('mentor');
  }
  if (caregiver) {
    target.push('caregiver');
  }
  const data = {
    title,
    body,
    serviceArea: [serviceArea],
    target,
    pinned,
    date: myTimestamp,
  };

  const submitData = () => {
    db.collection('messages').doc().set(data);
    setTitle('');
    setBody('');
    setServiceArea('');
    messages.push(<Message title={title} />);
  };
  const isAdmin = true;
  if (isAdmin) {
    return (
      <div>
        <h3>Message Wall</h3>
        <form>
          <div>
            <label htmlFor="title">
              Title:
              <input type="text" id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
          </div>
          <div>
            <label htmlFor="body">
              Body:
              <input type="text" id="body" name="body" value={body} onChange={(e) => setBody(e.target.value)} />
            </label>
          </div>
          <div>
            <label htmlFor="serviceArea">
              Service Area:
              <input type="text" id="serviceArea" name="serviceArea" value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} />
            </label>
          </div>
          <div>
            <label htmlFor="mentor">
              Mentor
              <input type="checkbox" id="mentor" name="mentor" checked={mentor} onChange={(e) => setMentor(e.target.checked)} />
            </label>
          </div>
          <div>
            <label htmlFor="caregiver">
              Caregiver
              <input type="checkbox" id="caregiver" name="caregiver" checked={caregiver} onChange={(e) => setCaregiver(e.target.checked)} />
            </label>
          </div>
          <button type="button" onClick={submitData}>Submit</button>
        </form>
      </div>
    );
  }
}
export default MessageWall;
