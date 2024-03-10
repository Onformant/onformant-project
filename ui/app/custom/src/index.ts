// Declare require method which we'll use for importing webpack resources (using ES6 imports will confuse typescript parser)
import {combineReducers, configureStore} from "@reduxjs/toolkit";
import "@openremote/or-app";
import {AnyAction, appReducer, AppStateKeyed, HeaderConfig, HeaderItem, OrApp, PageProvider, RealmAppConfig,AppConfig} from "@openremote/or-app";
import {
    headerItemAccount,
    headerItemAssets,
    headerItemConfiguration,
    headerItemExport,
    headerItemGatewayConnection,
    headerItemInsights,
    headerItemLanguage,
    headerItemLogout,
    headerItemLogs,
    headerItemMap,
    headerItemProvisioning,
    headerItemRealms,
    headerItemRoles,
    headerItemUsers
} from "@openremote/manager/headers";
import "@openremote/manager/pages/page-map";
import {PageMapConfig, pageMapProvider, pageMapReducer} from "@openremote/manager/pages/page-map";
import "@openremote/manager/pages/page-assets";
import {PageAssetsConfig, pageAssetsProvider, pageAssetsReducer} from "@openremote/manager/pages/page-assets";
import "@openremote/manager/pages/page-gateway";
import {pageGatewayProvider} from "@openremote/manager/pages/page-gateway";
import "@openremote/manager/pages/page-insights";
import {PageInsightsConfig, pageInsightsProvider} from "@openremote/manager/pages/page-insights";
import "@openremote/manager/pages/page-rules";
import {PageRulesConfig, pageRulesProvider} from "@openremote/manager/pages/page-rules";
import "@openremote/manager/pages/page-logs";
import {PageLogsConfig, pageLogsProvider} from "@openremote/manager/pages/page-logs";
import "@openremote/manager/pages/page-account";
import {pageAccountProvider} from "@openremote/manager/pages/page-account";
import "@openremote/manager/pages/page-users";
import {pageUsersProvider} from "@openremote/manager/pages/page-users";
import "@openremote/manager/pages/page-roles";
import {pageRolesProvider} from "@openremote/manager/pages/page-roles";
import "@openremote/manager/pages/page-realms";
import {pageRealmsProvider} from "@openremote/manager/pages/page-realms";
import {pageExportProvider} from "@openremote/manager/pages/page-export";
import { pageConfigurationProvider } from "@openremote/manager/pages/page-configuration";
import { ManagerAppConfig } from "@openremote/model";

declare var CONFIG_URL_PREFIX: string;
import "./pages/page-custom";
import {pageCustomProvider} from "./pages/page-custom";

const rootReducer = combineReducers({
    app: appReducer,
    map: pageMapReducer,
    assets: pageAssetsReducer
});

type RootState = ReturnType<typeof rootReducer>;

export const store = configureStore({
    reducer: rootReducer
});

const orApp = new OrApp(store);

export const DefaultPagesConfig: PageProvider<any>[] = [
    pageMapProvider(store), // Standard manager map page
    pageAssetsProvider(store), // Standard manager asset page
    pageCustomProvider(store),
    pageGatewayProvider(store),
    pageLogsProvider(store),
    pageInsightsProvider(store),
    pageRulesProvider(store),
    pageAccountProvider(store),
    pageRolesProvider(store),
    pageUsersProvider(store),
    pageRealmsProvider(store),
    pageExportProvider(store),
    pageConfigurationProvider(store)
];

// A new header for our custom page
export function headerItemCustom<S extends AppStateKeyed, A extends AnyAction>(orApp: OrApp<S>): HeaderItem {
    return {
        icon: "rhombus-split",
        href: "custom1",
        text: "app:customPage",
    };
}

export const DefaultHeaderMainMenu: {[name: string]: HeaderItem} = {
    map: headerItemMap(orApp),
    assets: headerItemAssets(orApp),
    custom: headerItemCustom(orApp),
    insights: headerItemInsights(orApp)
};

export const DefaultHeaderSecondaryMenu: {[name: string]: HeaderItem} = {
    gateway: headerItemGatewayConnection(orApp),
    language: headerItemLanguage(orApp),
    logs: headerItemLogs(orApp),
    account: headerItemAccount(orApp),
    users: headerItemUsers(orApp),
    roles: headerItemRoles(orApp),
    realms: headerItemRealms(orApp),
    export: headerItemExport(orApp),
    provisioning: headerItemProvisioning(orApp),
    configuration: headerItemConfiguration(orApp),
    logout: headerItemLogout(orApp)
};

export const DefaultHeaderConfig: HeaderConfig = {
    mainMenu: Object.values(DefaultHeaderMainMenu),
    secondaryMenu: Object.values(DefaultHeaderSecondaryMenu)
};

export const DefaultRealmConfig: RealmAppConfig = {
    appTitle: "Onformant App",
    header: DefaultHeaderConfig,
    styles: ":host > * {--or-app-color2: #F0F0F0; --or-app-color3: #22211f; --or-app-color4: #e3000a; --or-app-color5: #CCCCCC;}",
};
export const DefaultAppConfig: AppConfig<RootState> = {
    pages: DefaultPagesConfig,
    superUserHeader: DefaultHeaderConfig,
    realms: {
        default: DefaultRealmConfig
    }
};

// Try and load the app config from JSON and if anything is found amalgamate it with default
const configURL = (CONFIG_URL_PREFIX || "") + "/manager_config.json";
// Configure manager connection and i18next settings
fetch(configURL).then(async (result) => {
    if (!result.ok) {
        return DefaultAppConfig;
    }

    return await result.json() as ManagerAppConfig;

}).then((appConfig: ManagerAppConfig) => {

    // Set locales and load path
    if (!appConfig.manager) {
        appConfig.manager = {};
    }

    if (appConfig.loadLocales) {
        appConfig.manager.loadTranslations = ["app", "or"];

        if (!appConfig.manager.translationsLoadPath) {
            appConfig.manager.translationsLoadPath = "/locales/{{lng}}/{{ns}}.json";
        }
    }

    // Add config prefix if defined (used in dev)
    if (CONFIG_URL_PREFIX) {
        if (appConfig.manager.translationsLoadPath) {
            appConfig.manager.translationsLoadPath = CONFIG_URL_PREFIX + appConfig.manager.translationsLoadPath;
        }
    }

    orApp.managerConfig = appConfig.manager;

    orApp.appConfigProvider = (manager) => {

        // Build pages
        let pages: PageProvider<any>[] = [...DefaultPagesConfig];

        if (!(manager.isSuperUser() && manager.username === "admin") && appConfig.pages) {

            // Replace any supplied page configs
            pages = pages.map(pageProvider => {
                const config = appConfig.pages[pageProvider.name];

                switch (pageProvider.name) {
                    case "map": {
                        pageProvider = config ? pageMapProvider(store, config as PageMapConfig) : pageProvider;
                        break;
                    }
                    case "assets": {
                        pageProvider = config ? pageAssetsProvider(store, config as PageAssetsConfig) : pageProvider;
                        break;
                    }
                    case "rules": {
                        pageProvider = config ? pageRulesProvider(store, config as PageRulesConfig) : pageProvider;
                        break;
                    }
                    case "insights": {
                        pageProvider = config ? pageInsightsProvider(store, config as PageInsightsConfig) : pageProvider;
                        break;
                    }
                    case "logs": {
                        pageProvider = config ? pageLogsProvider(store, config as PageLogsConfig) : pageProvider;
                        break;
                    }
                }

                return pageProvider;
            });
        }

        const orAppConfig: AppConfig<RootState> = {
            pages: pages,
            superUserHeader: DefaultHeaderConfig
        };

        // Configure realms
        if (!appConfig.realms) {
            orAppConfig.realms = {
                default: {...DefaultRealmConfig, header: DefaultHeaderConfig}
            };
        } else {
            orAppConfig.realms = {};
            const defaultRealm = appConfig.realms.default ? {...DefaultRealmConfig,...appConfig.realms.default} : DefaultRealmConfig;
            orAppConfig.realms.default = defaultRealm;

            Object.entries(appConfig.realms).forEach(([name, realmConfig]) => {

                const normalisedConfig = {...defaultRealm,...realmConfig};

                let headers = DefaultHeaderConfig;

                if (normalisedConfig.headers) {
                    headers = {
                        mainMenu: [],
                        secondaryMenu: []
                    };
                    normalisedConfig.headers.forEach((pageName) => {
                        // Insert header
                        if (DefaultHeaderMainMenu.hasOwnProperty(pageName)) {
                            headers.mainMenu.push(DefaultHeaderMainMenu[pageName]);
                        } else if (DefaultHeaderSecondaryMenu.hasOwnProperty(pageName)) {
                            headers.secondaryMenu!.push(DefaultHeaderSecondaryMenu[pageName]);
                        }
                    });
                }

                orAppConfig.realms[name] = { ...defaultRealm, header: headers, ...(realmConfig as RealmAppConfig) };
            });
        }

        // Check local storage for set language, otherwise use language set in config
        manager.console.retrieveData("LANGUAGE").then((value: string | undefined) => {
            manager.language = (value ? value : orAppConfig.realms[manager.displayRealm].language);
        }).catch(() => {
            if (orAppConfig.realms[manager.displayRealm]){
                manager.language = orAppConfig.realms[manager.displayRealm].language
            } else if (orAppConfig.realms['default']){
                manager.language = orAppConfig.realms['default'].language
            } else {
                manager.language = 'en'
            }
        })

        // Add config prefix if defined (used in dev)
        if (CONFIG_URL_PREFIX) {
            Object.values(orAppConfig.realms).forEach((realmConfig) => {
                if (typeof (realmConfig.logo) === "string") {
                    realmConfig.logo = CONFIG_URL_PREFIX + realmConfig.logo;
                }
                if (typeof (realmConfig.logoMobile) === "string") {
                    realmConfig.logoMobile = CONFIG_URL_PREFIX + realmConfig.logoMobile;
                }
            });
        }

        return orAppConfig;
    };

    document.body.appendChild(orApp);
});
