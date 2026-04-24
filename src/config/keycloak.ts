import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: 'https://meet.soict.io/auth',
  realm: 'meeting',
  clientId: 'meeting-web-client'
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;