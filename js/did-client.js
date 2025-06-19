/**
 * DID Client - Retrieves and parses DID documents from domains
 * Specifically handles verifiable credential services discovery
 */

class DIDClient {
    constructor() {
        this.currentDID = null;
        this.vcServices = [];
        this.availableCredentials = [];
    }

    /**
     * Retrieves a DID document from the specified domain
     * @param {string} domain - Domain to retrieve DID document from (e.g., noosphere.tech)
     * @returns {Promise<Object>} - Parsed DID document
     */
    async retrieveDIDDocument(domain) {
        try {
            // Clean the domain (remove protocol, trailing slashes, etc.)
            const cleanDomain = this.cleanDomainInput(domain);
            
            // Build the URL to the DID document
            const didDocumentUrl = `https://${cleanDomain}/.well-known/did.json`;
            
            // Fetch the DID document
            const response = await fetch(didDocumentUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to retrieve DID document: ${response.status} ${response.statusText}`);
            }
            
            // Parse the DID document
            const didDocument = await response.json();
            this.currentDID = didDocument;
            
            // Extract VC services
            this.extractVCServices();
            
            return didDocument;
        } catch (error) {
            console.error('Error retrieving DID document:', error);
            throw error;
        }
    }
    
    /**
     * Cleans the domain input by removing protocols, paths, and trailing slashes
     * @param {string} domain - Domain input from user
     * @returns {string} - Cleaned domain
     */
    cleanDomainInput(domain) {
        // Remove protocol (http://, https://)
        let cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
        
        // Remove everything after the first slash (if any)
        cleanDomain = cleanDomain.split('/')[0];
        
        // Remove trailing slashes
        cleanDomain = cleanDomain.replace(/\/$/, '');
        
        return cleanDomain;
    }
    
    /**
     * Extracts Verifiable Credential services from the current DID document
     * @returns {Array} - Array of VC services
     */
    extractVCServices() {
        if (!this.currentDID || !this.currentDID.service) {
            this.vcServices = [];
            return [];
        }
        
        // Filter services to only include VC-related services
        this.vcServices = this.currentDID.service.filter(service => {
            return service.type === 'VerifiableCredentialService' || 
                  service.type.includes('VerifiableCredential') ||
                  service.type.includes('Credential');
        });
        
        return this.vcServices;
    }
    
    /**
     * Retrieves all services from the current DID document
     * @returns {Array} - Array of all services
     */
    getAllServices() {
        if (!this.currentDID || !this.currentDID.service) {
            return [];
        }
        
        return this.currentDID.service;
    }
    
    /**
     * Gets the VC service endpoint URLs
     * @returns {Array} - Array of service endpoint URLs
     */
    getVCServiceEndpoints() {
        if (!this.vcServices || this.vcServices.length === 0) {
            return [];
        }
        
        return this.vcServices.map(service => {
            if (typeof service.serviceEndpoint === 'string') {
                return service.serviceEndpoint;
            } else if (service.serviceEndpoint && service.serviceEndpoint.uri) {
                return service.serviceEndpoint.uri;
            } else if (service.serviceEndpoint && service.serviceEndpoint.origins && service.serviceEndpoint.origins.length > 0) {
                return service.serviceEndpoint.origins[0];
            }
            return null;
        }).filter(endpoint => endpoint !== null);
    }
    
    /**
     * Retrieves available credentials from a VC service endpoint
     * @param {string} endpoint - VC service endpoint URL
     * @returns {Promise<Array>} - List of available credentials
     */
    async getAvailableCredentials(endpoint) {
        try {
            // Some VC services expect /available or /list endpoint to get available credentials
            const availableEndpoint = endpoint.endsWith('/') ? 
                `${endpoint}available` : 
                `${endpoint}/available`;
            
            const response = await fetch(availableEndpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to retrieve available credentials: ${response.status} ${response.statusText}`);
            }
            
            const credentials = await response.json();
            this.availableCredentials = credentials;
            
            return credentials;
        } catch (error) {
            console.error('Error retrieving available credentials:', error);
            
            // Try alternate endpoint
            try {
                const listEndpoint = endpoint.endsWith('/') ? 
                    `${endpoint}list` : 
                    `${endpoint}/list`;
                
                const response = await fetch(listEndpoint, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to retrieve available credentials: ${response.status} ${response.statusText}`);
                }
                
                const credentials = await response.json();
                this.availableCredentials = credentials;
                
                return credentials;
            } catch (alternateError) {
                console.error('Error retrieving available credentials from alternate endpoint:', alternateError);
                throw error; // Throw original error
            }
        }
    }
    
    /**
     * Requests a specific verifiable credential from a VC service
     * @param {string} endpoint - VC service endpoint URL
     * @param {string} credentialId - ID of credential to request
     * @returns {Promise<Object>} - Requested credential
     */
    async requestCredential(endpoint, credentialId) {
        try {
            const requestEndpoint = endpoint.endsWith('/') ? 
                `${endpoint}${credentialId}` : 
                `${endpoint}/${credentialId}`;
            
            const response = await fetch(requestEndpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to request credential: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error requesting credential:', error);
            throw error;
        }
    }
}

// Initialize the DID client when the page loads
let didClient = null;

document.addEventListener('DOMContentLoaded', () => {
    didClient = new DIDClient();
    initializeUI();
});

/**
 * Initializes the UI for the DID client
 */
function initializeUI() {
    const domainForm = document.getElementById('domain-form');
    const domainInput = document.getElementById('domain-input');
    const servicesContainer = document.getElementById('services-container');
    const credentialsContainer = document.getElementById('credentials-container');
    const requestedCredentialContainer = document.getElementById('requested-credential-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');
    
    if (!domainForm || !domainInput) {
        console.error('Required UI elements not found!');
        return;
    }
    
    // Handle domain form submission
    domainForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const domain = domainInput.value.trim();
        if (!domain) {
            showError('Please enter a domain name');
            return;
        }
        
        // Show loading indicator
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }
        
        // Clear previous results
        if (servicesContainer) {
            servicesContainer.innerHTML = '';
        }
        if (credentialsContainer) {
            credentialsContainer.innerHTML = '';
        }
        if (requestedCredentialContainer) {
            requestedCredentialContainer.innerHTML = '';
        }
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
        
        try {
            // Retrieve the DID document
            const didDocument = await didClient.retrieveDIDDocument(domain);
            
            // Display the services
            displayServices(didDocument);
        } catch (error) {
            showError(`Error: ${error.message}`);
        } finally {
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        }
    });
}

/**
 * Displays services from a DID document
 * @param {Object} didDocument - Parsed DID document
 */
function displayServices(didDocument) {
    const servicesContainer = document.getElementById('services-container');
    if (!servicesContainer) {
        console.error('Services container not found!');
        return;
    }
    
    const services = didClient.getAllServices();
    
    if (!services || services.length === 0) {
        servicesContainer.innerHTML = '<p>No services found in the DID document.</p>';
        return;
    }
    
    // Clear previous services
    servicesContainer.innerHTML = '';
    
    // Create a heading
    const heading = document.createElement('h3');
    heading.textContent = 'Available Services';
    servicesContainer.appendChild(heading);
    
    // Create a list of services
    const servicesList = document.createElement('ul');
    servicesList.className = 'services-list';
    
    services.forEach(service => {
        const serviceItem = document.createElement('li');
        serviceItem.className = 'service-item';
        
        // Highlight VC services
        const isVCService = service.type === 'VerifiableCredentialService' || 
                           service.type.includes('VerifiableCredential') ||
                           service.type.includes('Credential');
        
        if (isVCService) {
            serviceItem.className += ' vc-service';
        }
        
        // Create service title
        const serviceTitle = document.createElement('div');
        serviceTitle.className = 'service-title';
        serviceTitle.textContent = service.type;
        
        // Create service endpoint
        const serviceEndpoint = document.createElement('div');
        serviceEndpoint.className = 'service-endpoint';
        
        let endpointText = '';
        if (typeof service.serviceEndpoint === 'string') {
            endpointText = service.serviceEndpoint;
        } else if (service.serviceEndpoint && service.serviceEndpoint.uri) {
            endpointText = service.serviceEndpoint.uri;
        } else if (service.serviceEndpoint && service.serviceEndpoint.origins && service.serviceEndpoint.origins.length > 0) {
            endpointText = service.serviceEndpoint.origins[0];
        } else {
            endpointText = 'No endpoint available';
        }
        
        serviceEndpoint.textContent = endpointText;
        
        // Add a button for VC services
        if (isVCService) {
            const vcButton = document.createElement('button');
            vcButton.className = 'vc-button button';
            vcButton.textContent = 'Get Available Credentials';
            
            vcButton.addEventListener('click', async () => {
                const loadingIndicator = document.getElementById('loading-indicator');
                const errorMessage = document.getElementById('error-message');
                
                // Show loading indicator
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'block';
                }
                
                // Clear previous credentials
                const credentialsContainer = document.getElementById('credentials-container');
                if (credentialsContainer) {
                    credentialsContainer.innerHTML = '';
                }
                
                try {
                    const credentials = await didClient.getAvailableCredentials(endpointText);
                    displayCredentials(credentials, endpointText);
                } catch (error) {
                    if (errorMessage) {
                        errorMessage.textContent = `Error: ${error.message}`;
                        errorMessage.style.display = 'block';
                    }
                } finally {
                    // Hide loading indicator
                    if (loadingIndicator) {
                        loadingIndicator.style.display = 'none';
                    }
                }
            });
            
            serviceItem.appendChild(serviceTitle);
            serviceItem.appendChild(serviceEndpoint);
            serviceItem.appendChild(vcButton);
        } else {
            serviceItem.appendChild(serviceTitle);
            serviceItem.appendChild(serviceEndpoint);
        }
        
        servicesList.appendChild(serviceItem);
    });
    
    servicesContainer.appendChild(servicesList);
}

/**
 * Displays available credentials from a VC service
 * @param {Array} credentials - List of available credentials
 * @param {string} endpoint - VC service endpoint URL
 */
function displayCredentials(credentials, endpoint) {
    const credentialsContainer = document.getElementById('credentials-container');
    if (!credentialsContainer) {
        console.error('Credentials container not found!');
        return;
    }
    
    // Clear previous credentials
    credentialsContainer.innerHTML = '';
    
    if (!credentials || credentials.length === 0) {
        credentialsContainer.innerHTML = '<p>No credentials available from this service.</p>';
        return;
    }
    
    // Create a heading
    const heading = document.createElement('h3');
    heading.textContent = 'Available Credentials';
    credentialsContainer.appendChild(heading);
    
    // Create a list of credentials
    const credentialsList = document.createElement('ul');
    credentialsList.className = 'credentials-list';
    
    credentials.forEach(credential => {
        const credentialItem = document.createElement('li');
        credentialItem.className = 'credential-item';
        
        // Create credential title
        const credentialTitle = document.createElement('div');
        credentialTitle.className = 'credential-title';
        
        // Different credential formats will have different properties
        if (credential.id) {
            credentialTitle.textContent = credential.id;
        } else if (credential.name) {
            credentialTitle.textContent = credential.name;
        } else if (credential.type) {
            credentialTitle.textContent = Array.isArray(credential.type) ? 
                credential.type.join(', ') : 
                credential.type;
        } else {
            credentialTitle.textContent = 'Unknown Credential';
        }
        
        // Add a button to request the credential
        const requestButton = document.createElement('button');
        requestButton.className = 'request-button button';
        requestButton.textContent = 'Request Credential';
        
        requestButton.addEventListener('click', async () => {
            const loadingIndicator = document.getElementById('loading-indicator');
            const errorMessage = document.getElementById('error-message');
            
            // Show loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'block';
            }
            
            try {
                const credentialId = credential.id || credential.name || 'credential';
                const requestedCredential = await didClient.requestCredential(endpoint, credentialId);
                displayRequestedCredential(requestedCredential);
            } catch (error) {
                if (errorMessage) {
                    errorMessage.textContent = `Error: ${error.message}`;
                    errorMessage.style.display = 'block';
                }
            } finally {
                // Hide loading indicator
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
            }
        });
        
        credentialItem.appendChild(credentialTitle);
        credentialItem.appendChild(requestButton);
        
        credentialsList.appendChild(credentialItem);
    });
    
    credentialsContainer.appendChild(credentialsList);
}

/**
 * Displays a requested credential
 * @param {Object} credential - Requested credential
 */
function displayRequestedCredential(credential) {
    const requestedCredentialContainer = document.getElementById('requested-credential-container');
    if (!requestedCredentialContainer) {
        console.error('Requested credential container not found!');
        return;
    }
    
    // Clear previous credential
    requestedCredentialContainer.innerHTML = '';
    
    // Create a heading
    const heading = document.createElement('h3');
    heading.textContent = 'Requested Credential';
    requestedCredentialContainer.appendChild(heading);
    
    // Pretty-print the credential
    const credentialJson = document.createElement('pre');
    credentialJson.className = 'credential-json';
    credentialJson.textContent = JSON.stringify(credential, null, 2);
    
    requestedCredentialContainer.appendChild(credentialJson);
}

/**
 * Shows an error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    if (!errorMessage) {
        console.error('Error message element not found!');
        console.error(message);
        return;
    }
    
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}