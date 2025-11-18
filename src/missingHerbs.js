import {useState} from 'react';
import {useEffect} from 'react';
import humps from 'humps';
import {useCookies} from "react-cookie";
import {styled} from '@mui/system';
import Box from '@mui/system/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import './styles.css';
import {Navigate, useParams} from "react-router-dom";
import Button from "@mui/material/Button";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';


const StackItem = styled('div')(({theme}) => ({
  backgroundColor: '#fff',
  textAlign: 'left',
  borderRadius: 4,
  ...theme.applyStyles('dark', {
    backgroundColor: '#262B32',
  }),
}));

export default function Overview() {

  const [cookies, setCookies] = useCookies(['herbauth']);
  const [orderBatch, setOrderBatch] = useState(null);
  const [missingHerbs, setMissingHerbs] = useState(null);
  const {orderBatchId} = useParams();

  const [isLoading, setIsLoading] = useState(true);

  const [placeholder, setPlaceholder] = useState(null);

  useEffect(() => initializeOverview(), []);

  function initializeOverview() {
    if (cookies.herbauth === undefined) {
      return;
    }
    fetchOrderBatch()
    .then(orderBatch => fetchMissingHerbs());
  }

  function fetchMissingHerbs() {
    const requestOptions = {
      method: 'GET',
      headers: {
        Accept: 'application/json,application/problem+json',
        Authorization: 'Basic ' + cookies.herbauth
      }
    }
    return fetch(
        process.env.REACT_APP_BACKEND_URL + '/api/admin/order_batches/' + orderBatchId + '/missing-herbs',
        requestOptions)
    .then(response => {
      if (response.status !== 200) {
        throw Error(response.json().detail);
      } else {
        return response.json();
      }
    })
    .then(data => humps.camelizeKeys(data))
    .then(data => data.sort(herbsSorting))
    .then(data => calculateDifferences(data))
    .then(data => addKeys(data))
    .then(data => setMissingHerbs(data))
    .then(() => setIsLoading(false))
    .catch(error => {
      console.log("Error: " + error);
      setIsLoading(false);
    });
  }

  function herbsSorting(o1, o2) {
  	if (o1.herbName < o2.herbName) {
		return -1;
  	} else if (o1.herbName > o2.herbName) {
  		return 1;
  	}
  	const name1 = o1.firstName + " " + o1.lastName;
  	const name2 = o2.firstName + " " + o2.lastName;
  	if (name1 < name2) {
  		return -1;
  	} else if (name1 > name2) {
  		return 1;
  	}
    return 0;
  }

  function addKeys(herbs) {
    return herbs.map((herb, index) => {
      herb.key = index;
      return herb;
    });
  }

  function calculateDifferences(missingHerbs) {
    return missingHerbs.map(herbStat => {
      const quantityShipped = herbStat.quantityShipped == null ? 0 : herbStat.quantityShipped;
      herbStat.difference = herbStat.quantityOrdered - herbStat.quantityShipped;
      return herbStat;
    });
  }

  function fetchOrderBatch() {
    const requestOptions = {
      method: 'GET',
      headers: {
        Accept: 'application/json,application/problem+json',
        Authorization: 'Basic ' + cookies.herbauth
      }
    };
    return fetch(
        process.env.REACT_APP_BACKEND_URL + '/api/admin/order_batches/' + orderBatchId,
        requestOptions)
    .then(response => {
      if (response.status !== 200) {
        throw Error(response.json().detail);
      } else {
        return response.json();
      }
    })
    .then(data => humps.camelizeKeys(data))
    .then(data => {
      console.log("Order Batch data: ", data);
      return data;
    })
    .then(data => setOrderBatch(data))
    .then(() => setIsLoading(false))
    .catch(error => {
      console.log("Error: " + error);
      setIsLoading(false);
    });
  }

  if (cookies.herbauth === undefined) {
    return (
        <Navigate to="/admin" />
    );
  }

  if (orderBatch === null || missingHerbs === null) {
    return (
        <Box sx={{
          width: {s: 1, sm: 600},
          marginTop: 9,
          marginLeft: 2,
        }}>
          {isLoading ?
              <LinearProgress/>
              : <Box>Die angegebene Sammelbestellung wurde nicht gefunden!</Box>
          }
        </Box>
    );
  }

  return (
      <Box sx={{
        width: {s: 1, sm: 600},
        marginTop: 9,
        marginLeft: 2,
      }}>
          <TableContainer component={Paper}>
            <Table sc={{minWidth: 600}} aria-label="herb table">
              <TableHead>
                <TableRow>
                  <TableCell>
                    Kräuter
                  </TableCell>
                  <TableCell>
                    Name
                  </TableCell>
                  <TableCell>
                    Fehlende Anzahl
                  </TableCell>
                  <TableCell>
                    Details
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {
                  missingHerbs.map(herb =>
                      <TableRow key={herb.key}>
                        <TableCell>
                          {herb.herbName}
                        </TableCell>
                        <TableCell>
                          {herb.firstName} {herb.lastName}
                        </TableCell>
                        <TableCell>
                          {herb.difference}
                        </TableCell>
                        <TableCell>
                        	<Button variant="contained"
				        		href={"/admin/orders/" + herb.externalOrderId}
				        		endIcon={<ArrowForwardIcon/>}>
                  				Zur Bestellung
                  			</Button>
                        </TableCell>
                      </TableRow>
                  )
                }
              </TableBody>
            </Table>
          </TableContainer>
      </Box>
  );

}
