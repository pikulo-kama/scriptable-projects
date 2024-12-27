
/**
 * TV series API resource factory.
 * Should always be used to get instance of ApiResource.
 */
class ApiResourceFactory {

    /**
     * Used to get instance of ApiResource.
     * 
     * @returns {ApiResource} resource with series info
     */
    static getResource() {

        if (conf.debug.mockData) {
            return new StubApiResource();
        }

        return new EpisodateApiResource();
    }
}
