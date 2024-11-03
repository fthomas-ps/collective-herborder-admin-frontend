import {useState} from 'react';
import {useEffect} from 'react';
import humps from 'humps';
import {styled} from '@mui/system';
import Box from '@mui/system/Box';
import Stack from '@mui/system/Stack';
import Grid from '@mui/system/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import './styles.css';

const Item = styled('div')(({theme}) => ({
  width: '100%',
  height: '100%',
  backgroundColor: '#fff',
  //border: '1px solid',
  //borderColor: '#ced7e0',
  padding: theme.spacing(1),
  borderRadius: '4px',
  textAlign: 'left',
  valign: 'bottom',
  ...theme.applyStyles('dark', {
    backgroundColor: '#1A2027',
    borderColor: '#444d58',
  }),
}));

const StackItem = styled('div')(({theme}) => ({
  backgroundColor: '#fff',
  textAlign: 'left',
  borderRadius: 4,
  ...theme.applyStyles('dark', {
    backgroundColor: '#262B32',
  }),
}));

export default function CollectiveOrder() {

  const [collectiveOrder, setCollectiveOrder] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => initializeCollectiveOrder(), []);

  function initializeCollectiveOrder() {
    fetchAvailableHerbs()
    .then(herbs => fetchCollectiveOrder(herbs));
  }

  function fetchAvailableHerbs() {
    const requestOptions = {
      method: 'GET'
    };
    return fetch(process.env.REACT_APP_BACKEND_URL + '/api/herbs',
        requestOptions)
    .then(response => response.json())
    .then(data => humps.camelizeKeys(data));
  }

  function fetchCollectiveOrder(herbs) {
    const requestOptions = {
      method: 'GET',
      headers: {Accept: 'application/json,application/problem+json'}
    }
    return fetch(
        process.env.REACT_APP_BACKEND_URL + '/api/admin/orders/aggregated',
        requestOptions)
    .then(response => {
      if (response.status !== 200) {
        throw Error(response.json().detail);
      } else {
        return response.json();
      }
    })
    .then(data => humps.camelizeKeys(data))
    .then(data => addHerbNames(data, herbs))
    .then(data => addHerbKeys(data))
    .then(data => setCollectiveOrder(data))
    .then(() => setIsLoading(false))
    .catch(error => {
      console.log("Error: " + error);
      setIsLoading(false);
    });
  }

  function addHerbNames(collectiveOrder, herbs) {
    return collectiveOrder
    .map((herb) => {
      herb.name = herbs
      .find(h => h.id === herb.herbId)
          .name;
      return herb;
    });
  }

  function addHerbKeys(collectiveOrder) {
    return collectiveOrder
    .map((herb, index) => {
      herb.key = index;
      return herb;
    });
  }

  if (isLoading) {
    return (
        <Box sx={{width: {s: 1, sm: 600}}}>
          <Typography variant="h3" gutterBottom>Kräuterbestellung
            2025</Typography>
          <LinearProgress/>
        </Box>
    );
  }

  return (
      <Box sx={{width: {s: 1, sm: 600}}}>
        <Typography variant="h3" gutterBottom>Kräuterbestellung
          2025</Typography>
        <Box sx={{
          marginTop: 3,
          marginBottom: 3,
          padding: 2,
          border: "1px solid rgb(192,192,192)",
          borderRadius: 3,
          backgroundColor: "rgb(255,255,255)"
        }}>
          <Typography variant="h4" gutterBottom>Sammelbestellung für
            Ayushakti</Typography>
          <TableContainer component={Paper}>
            <Table sc={{minWidth: 600}} aria-label="herb table">
              <TableHead>
                <TableRow>
                  <TableCell>
                    Kräuter
                  </TableCell>
                  <TableCell>
                    Anzahl
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {
                  collectiveOrder.map(herb =>
                      <TableRow key={herb.key}>
                        <TableCell>
                          {herb.name}
                        </TableCell>
                        <TableCell>
                          {herb.quantity}
                        </TableCell>
                      </TableRow>
                  )
                }
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
  );

}
