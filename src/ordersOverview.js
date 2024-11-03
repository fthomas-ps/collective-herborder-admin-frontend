import {useState} from 'react';
import {useEffect} from 'react';
import {Navigate} from "react-router-dom";
import { useCookies } from 'react-cookie';
import humps from 'humps';
import Box from '@mui/system/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import LinearProgress from '@mui/material/LinearProgress';
import './styles.css';

export default function OrdersOverview() {

  const [cookies, setCookies] = useCookies(['herbauth']);
  const [orders, setOrders] = useState([]);
  const [placeholder, setPlaceholder] = useState((<></>));

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => initializeHerbOrders(), []);

  function initializeHerbOrders() {
    if (cookies.herbauth === undefined) {
      return;
    }
    const requestOptions = {
      method: 'GET',
      headers: {
        Accept: 'application/json,application/problem+json',
        Authorization: 'Basic ' + cookies.herbauth
      }
    }
    fetch(process.env.REACT_APP_BACKEND_URL + '/api/admin/orders',
        requestOptions)
    .then(response => {
      if (response.status !== 200) {
        throw Error(response.json().detail);
      } else {
        return response.json();
      }
    })
    .then(data => humps.camelizeKeys(data))
    .then(data => addKeys(data))
    .then(data => data.sort(ordersSorting))
    .then(data => setOrders(data))
    .then(() => setIsLoading(false))
    .catch(error => {
      console.log("Error: " + error);
      setIsLoading(false);
    });
  }

  function ordersSorting(o1, o2) {
    const name1 = o1.firstName + " " + o1.lastName;
    const name2 = o2.firstName + " " + o2.lastName;
    return ((name1 < name2) ? -1 : (name1 > name2) ? 1 : 0);
  }

  function addKeys(orders) {
    return orders.map((order, index) => {
      order.key = index;
      return order;
    });
  }

  function openEditOrder(externalId) {
    setPlaceholder(<Navigate to={"./" + externalId} />);
  }

  if (cookies.herbauth === undefined) {
    return (
        <Navigate to="/admin" />
    );
  }

  if (isLoading) {
    return (
        <Box sx={{
          width: {s: 1, sm: 600},
          marginTop: 9,
          marginLeft: 2,
        }}>
          <LinearProgress/>
        </Box>
    );
  }

  return (

        <Box sx={{
          width: {s: 1, sm: 600},
          marginTop: 9,
          marginLeft: 2,
        }}>
          <Typography variant="h4" gutterBottom>Bestellungen</Typography>
          <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
            {
              orders.map((order) => (
                  <ListItem key={order.key}>
                    <ListItemButton onClick={() => openEditOrder(order.externalId)} dense>
                      <ListItemText primary={order.firstName + " " + order.lastName} secondary={order.mail} />
                    </ListItemButton>
                  </ListItem>
              ))
            }
          </List>
          {placeholder}
        </Box>
  );
}
