import AskCFOBot from './pages/AskCFOBot';
import Decisions from './pages/Decisions';
import Forecast from './pages/Forecast';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Snapshot from './pages/Snapshot';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AskCFOBot": AskCFOBot,
    "Decisions": Decisions,
    "Forecast": Forecast,
    "Home": Home,
    "Settings": Settings,
    "Snapshot": Snapshot,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};