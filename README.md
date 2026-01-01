# Formulario de Registro de Clientes para Alojamientos 


Para iniciar proyecto:
``` bash
npm start
```

## Conectar con supabase

Crear archivo /srv/supabaseClient.js

``` js
import { createClient } from "@supabase/supabase-js";

/** Dentro de Project Setting --> API KEY's --> Legacy anon, service_role API keys **/
const supabaseUrl = "https://URL_PROYECTO_SUPABASE.supabase.co"; 
const supabaseAnonKey = "ANNON_KEY_DE_SUPABASE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

