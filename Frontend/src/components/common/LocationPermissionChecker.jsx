// Location Permission Checker Component for Homestr
import React, { useState, useEffect } from 'react';
import LocationAccessModal from './LocationAccessModal';
import flutterBridge from '../../utils/flutterBridge';

export const LocationPermissionChecker = () => {
    const [showModal, setShowModal] = useState(false);
    const [isLocationDisabled, setIsLocationDisabled] = useState(false);
    const [userType, setUserType] = useState('user');

    useEffect(() => {
        // ... previous user logic ...
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const vendorData = JSON.parse(localStorage.getItem('vendorData') || '{}');
        const workerData = JSON.parse(localStorage.getItem('workerData') || '{}');

        let type = 'user';
        if (vendorData._id || vendorData.id) type = 'vendor';
        else if (workerData._id || workerData.id) type = 'worker';
        setUserType(type);

        const checkPermission = async (isManualTrigger = false) => {
            // console.log('Checking location permissions (manual:', isManualTrigger, ')');

            // If manual trigger (user clicked something), always show modal immediately
            if (isManualTrigger) {
                setShowModal(true);
                return;
            }

            const hasGrantedPreviously = localStorage.getItem('location_granted') === 'true';

            // 1. Silent check via Unified Bridge (prefers Native GPS)
            try {
                const location = await flutterBridge.getCurrentLocation();
                // console.log('Location already granted (bridge check success)');
                localStorage.setItem('location_granted', 'true');
                setShowModal(false);
            } catch (err) {
                // If we don't have permission, or it's turned off, show modal
                if (err.code === 1 || err.code === 2) {
                    setIsLocationDisabled(true);
                }
                
                if (!hasGrantedPreviously || err.code === 1 || err.code === 2) {
                    setShowModal(true);
                }
            }

            // 2. Parallel check with Permissions API if available
            if (navigator.permissions) {
                try {
                    const status = await navigator.permissions.query({ name: 'geolocation' });
                    // console.log('Permissions API status:', status.state);

                    if (status.state === 'denied' || status.state === 'prompt') {
                        if (!hasGrantedPreviously) setShowModal(true);
                    }

                    status.onchange = () => {
                        // console.log('Permission state changed to:', status.state);
                        if (status.state === 'granted') {
                            setShowModal(false);
                            localStorage.setItem('location_granted', 'true');
                        }
                    };
                } catch (e) {
                    console.warn('Permissions API query failed:', e);
                }
            }
        };

        // Delay execution to ensure Flutter WebView is fully ready
        const timer = setTimeout(() => {
            checkPermission(false);
        }, 1500);


        // Global listener for manual triggers
        const handleManualTrigger = () => {
            console.log('Manual location trigger received');
            setShowModal(true);
        };
        window.addEventListener('requestLocationPrompt', handleManualTrigger);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('requestLocationPrompt', handleManualTrigger);
        };
    }, []);



    const handleSuccess = (coords) => {
        console.log('Location granted:', coords);
        localStorage.setItem('location_granted', 'true');
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
            initialLocationDisabled={isLocationDisabled}
            userType={userType}
        />
    );
};
