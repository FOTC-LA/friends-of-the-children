import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/sliceAuth';
import fotcLogo from '../assets/images/fotc_logo.svg';
import styles from '../styles/NavBar.module.css';
import ResourcesIcon from '../assets/icons/resources_icon.svg';
import MenteesIcon from '../assets/icons/mentees_icon.svg';
import MessageIcon from '../assets/icons/message_icon.svg';
import CalendarIcon from '../assets/icons/calendar_icon.svg';
import UserIcon from '../assets/icons/user_icon.svg';

function NavBar({ profile, updateAppProfile }) {
  // const [loggedIn, setLoggedIn] = useState(false);
  // console.log(profile);
  const dispatch = useDispatch();
  const handleLogout = () => {
    updateAppProfile(null);
    dispatch(logout(profile));
  };

  // "login-buttons d-flex align-items-center justify-content-center gap-3 py-2"
  return (
    <div>
      {!profile
        ? (
          <div>
            {/* <Link to="/login" className="btn btn-primary" onClick={() => setLoggedIn(true)}> Log In </Link>
            <Link to="/signup" className="btn btn-primary" onClick={() => setLoggedIn(true)}> Sign Up </Link> */}
            <a href="/">
              <img
                style={{
                  position: 'absolute', width: '139px', height: '67px', left: '61px', top: '40px',
                }}
                src={fotcLogo}
                alt="fotc logo"
              />
            </a>
            {/* <Link to="/login" className="btn btn-primary"> Log In </Link>
            <Link to="/signup" className="btn btn-primary"> Sign Up </Link> */}
          </div>
        )
        : (
          <div className={styles.container}>
            <a href="/">
              <img
                style={{
                  marginBottom: '70px', width: '139px', height: '67px', top: '40px',
                }}
                src={fotcLogo}
                alt="fotc logo"
              />
            </a>
            <Link to="/modules" className={styles.btn_info}>
              <img src={ResourcesIcon} alt="resources icon" />
              Resources
            </Link>
            {/* have requests link instead for admin */}
            <Link to="/modules" className={styles.btn_info}>
              <img src={MenteesIcon} alt="mentees icon" />
              My Mentees
            </Link>
            <Link to="/calendar" className={styles.btn_info}>
              <img src={CalendarIcon} alt="calendar icon" />
              Calendar
            </Link>
            <Link to="/message-wall" className={styles.btn_info}>
              <img src={MessageIcon} alt="message icon" />
              Messages
            </Link>
            <Link to="/profile" className={styles.btn_info}>
              <img src={UserIcon} alt="profile icon" />
              Profile
            </Link>
            <Link to="/" className={`${styles.btn_info} ${styles.btn_danger}`} onClick={handleLogout}> Log Out </Link>
          </div>
        )}
    </div>

  );
}

NavBar.propTypes = {
  profile: PropTypes.shape({
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    serviceArea: PropTypes.string.isRequired,
  }).isRequired,
};

NavBar.propTypes = {
  updateAppProfile: PropTypes.func.isRequired,
};

export default NavBar;
