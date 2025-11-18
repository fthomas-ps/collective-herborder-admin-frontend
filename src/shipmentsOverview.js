import {useState} from 'react';
import {useEffect} from 'react';
import {Navigate, useParams} from "react-router-dom";
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
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";

export default function ShipmentsOverview() {

  const [cookies, setCookies] = useCookies(['herbauth']);
  const [shipments, setShipments] = useState([]);
  const [placeholder, setPlaceholder] = useState((<></>));
  const {orderBatchId} = useParams();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => initializeShipments(), []);

  function initializeShipments() {
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
    fetch(process.env.REACT_APP_BACKEND_URL + '/api/admin/order_batches/' + orderBatchId + '/shipments',
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
    .then(data => data.sort(shipmentsSorting))
    .then(data => setShipments(data))
    .then(() => setIsLoading(false))
    .catch(error => {
      console.log("Error: " + error);
      setIsLoading(false);
    });
  }

  function shipmentsSorting(o1, o2) {
    const date1 = o1.date + " " + o1.date;
    const date2 = o2.date + " " + o2.date;
    return ((date1 < date2) ? -1 : (date1 > date2) ? 1 : 0);
  }

  function addKeys(shipments) {
    return shipments.map((shipments, index) => {
      shipments.key = index;
      return shipments;
    });
  }

  function openEditShipment(id) {
    setPlaceholder(<Navigate to={"./" + id} />);
  }

  function addShipment() {
    setPlaceholder(<Navigate to="./new" />);
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
          <Typography variant="h4" gutterBottom>Lieferungen</Typography>
          <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
            {
              shipments.map((shipment) => (
                  <ListItem key={shipment.key}>
                    <ListItemButton onClick={() => openEditShipment(shipment.id)} dense>
                      <ListItemText primary={shipment.date} />
                    </ListItemButton>
                  </ListItem>
              ))
            }
          </List>
          <Button variant="contained"
                  onClick={addShipment}
                  startIcon={<AddIcon/>}>Hinzufügen</Button>
          {placeholder}
        </Box>
  );
}
