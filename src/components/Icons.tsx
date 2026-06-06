import React from 'react';
import { FaBus, FaShuttleVan, FaTrain, FaMapMarkedAlt, FaMapMarkerAlt, FaExclamationTriangle, FaTicketAlt, FaUser, FaCreditCard, FaSearch, FaRoute } from 'react-icons/fa';

export const Icons = {
  bus: () => <FaBus className="inline-block" />,
  car: () => <FaShuttleVan className="inline-block" />,
  brt: () => <FaBus className="inline-block" />,
  train: () => <FaTrain className="inline-block" />,
  map: () => <FaMapMarkedAlt className="inline-block" />,
  pin: () => <FaMapMarkerAlt className="inline-block" />,
  warn: () => <FaExclamationTriangle className="inline-block" />,
  ticket: () => <FaTicketAlt className="inline-block" />,
  user: () => <FaUser className="inline-block" />,
  card: () => <FaCreditCard className="inline-block" />,
  search: () => <FaSearch className="inline-block" />,
  route: () => <FaRoute className="inline-block" />,
};

export default Icons;
