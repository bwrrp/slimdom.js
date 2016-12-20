import DOMImplementation from './DOMImplementation';

interface SlimdomGlobals {
	domImplementation: DOMImplementation | null
}

export default {
	domImplementation: null
} as SlimdomGlobals;
