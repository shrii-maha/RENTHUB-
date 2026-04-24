import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'motion/react';
import { ExternalLink, Star } from 'lucide-react';

// Fix for Leaflet default icon issues with build tools
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function MapView({ listings, onProductSelect }) {
  // Filter only listings with coordinates
  const listingsWithCoords = listings.filter(l => l.lat && l.lng);

  // Default center (Mumbai, India) if no listings or first listing's location
  const center = listingsWithCoords.length > 0 
    ? [listingsWithCoords[0].lat, listingsWithCoords[0].lng]
    : [19.0760, 72.8777];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-[600px] w-full rounded-[2.5rem] overflow-hidden border border-brand-primary/10 shadow-2xl relative z-10"
    >
      <MapContainer 
        center={center} 
        zoom={12} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {listingsWithCoords.map((item) => (
          <Marker 
            key={item._id || item.id} 
            position={[item.lat, item.lng]}
            icon={defaultIcon}
          >
            <Popup className="premium-popup">
              <div className="w-48 flex flex-col gap-2 p-1">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-24 object-cover rounded-lg"
                />
                <div>
                  <h4 className="font-bold text-sm truncate">{item.title}</h4>
                  <p className="text-brand-accent font-bold text-xs">{item.price}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-brand-accent fill-brand-accent" />
                  <span className="text-[10px] font-bold">{item.rating || '5.0'}</span>
                </div>
                <button 
                  onClick={() => onProductSelect(item)}
                  className="w-full py-2 bg-brand-primary text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 hover:bg-brand-accent transition-colors mt-1"
                >
                  View Details
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </motion.div>
  );
}
