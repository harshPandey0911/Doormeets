import React, { useState, useEffect } from 'react';
import LocationAccessModal from './LocationAccessModal';

const LocationPermissionChecker = () => {
    const [showModal, setShowModal] = useState(false);
    const [userType, setUserType] = useState('user');

    useEffect(() => {
        // Detect user type from session/localStorage
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const vendorData = JSON.parse(localStorage.getItem('vendorData') || '{}');
        const workerData = JSON.parse(localStorage.getItem('workerData') || '{}');

        let type = 'user';
        if (vendorData._id || vendorData.id) type = 'vendor';
        else if (workerData._id || workerData.id) type = 'worker';
        
        setUserType(type);

        // Check if we already have permission
        const checkPermission = async () => {
            if (!navigator.permissions) {
                // Fallback for browsers without permissions API - try a small delay
                setTimeout(() => setShowModal(true), 1500);
                return;
            }

            try {
                const status = await navigator.permissions.query({ name: 'geolocation' });
                
                if (status.state !== 'granted') {
                    // Always show if not granted
                    setTimeout(() => setShowModal(true), 1000);
                }
                
                status.onchange = () => {
                    if (status.state === 'granted') {
                        setShowModal(false);
                    } else {
                        setShowModal(true);
                    }
                };
            } catch (error) {
                // If query fails, it usually means we should prompt
                setTimeout(() => setShowModal(true), 1500);
            }
        };

        checkPermission();
    }, []);

    const handleSuccess = (coords) => {
        console.log('Location granted:', coords);
        // You can dispatch a global event or update context here
        window.dispatchEvent(new CustomEvent('locationUpdate', { detail: coords }));
    };

    const handleClose = () => {
        setShowModal(false);
    };

    return (
        <LocationAccessModal 
            isOpen={showModal}
            onClose={handleClose}
            onSuccess={handleSuccess}
            userType={userType}
        />
    );
};

export default LocationPermissionChecker;
