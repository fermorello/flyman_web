import { Table } from 'reactstrap';
import Row from './Row';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { DataGrid} from '@mui/x-data-grid';

const columns = [
    { field: 'id', headerName: 'ID', width: 70, hide: true },
    { field: 'plate', headerName: 'Patente', width: 130, resizable:true,
        sortable:false,
        width: 160,
        valueGetter: (params) =>`${params.row.plate}`,
    },
    { field: 'description', headerName: 'Modelo', width: 130 },
    { field: 'fuelLevel', headerName: 'Combustible', width: 130 },
    { field: 'fuelType', headerName: 'Tipo de combustible', width: 130 },
    { field: 'parkingName', headerName: 'Estacionamiento', width: 130 },
    { field: 'idParkingSlot', headerName: 'Ubicacion', width: 130 },
    ]
  

function Home() {
    const [cars, setCars] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [carsWithReservationFirst, setCarsWithReservationFirst] = useState([]);

    useEffect(() => {
        console.log('use effect');
        async function fetchData() {
            // TODO: sacar URL hardcodeada.
            const carsResponse = await axios.get('http://192.168.0.140:3000/cars/');
            setCars(carsResponse.data);

            const reservantionResponse = await axios.get('http://192.168.0.140:3000/reservations/');
            setReservations(reservantionResponse.data)   
            
        }
        fetchData();
    }, [])

    useEffect(()=>{
        //separo los autos con reserva
        let filteredCars= cars.filter((c)=>{
            return reservations.some((r)=>{
                return r.car.plate == c.plate;
            });
        });
        
        //separo el resto de los autos sacando los que tenian reserva
        let restOfcars = cars.filter((c)=>{
            return !filteredCars.includes(c)
        })    
                
        //junto los dos array quedando los que tienen reserva al principio y agregando los otros detrás
        //TODO: ordenar previamente los reservados por fecha más próxima
        filteredCars.push(...restOfcars)

        //lo mapeo para la tabla
        const carsForTable = filteredCars.map((car)=>{
            return {
              id:car._id,
              plate: car.plate,
              description: car.description,
              fuelLevel: car.fuelLevel,
              fuelType: car.fuelType,
              parkingName: car.parkingName,
              idParkingSlot: car.idParkingSlot,
              lastModifiedDate: car.lastModifiedDate
            }
          }) 
        
        setCarsWithReservationFirst(carsForTable);
    },[cars])

    return (
        <div style={{ height: 800, width: '100%' }}>
        <DataGrid
          rows={carsWithReservationFirst}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[5]}
          checkboxSelection
        />
      </div> 
    );
}


export default Home;