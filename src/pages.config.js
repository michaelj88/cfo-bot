import Snapshot from './pages/Snapshot';
import Forecast from './pages/Forecast';
import Decisions from './pages/Decisions';
import AskCFOBot from './pages/AskCFOBot';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Snapshot": Snapshot,
    "Forecast": Forecast,
    "Decisions": Decisions,
    "AskCFOBot": AskCFOBot,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Snapshot",
    Pages: PAGES,
    Layout: __Layout,
};