// Command serve serves web/ over HTTP for the browser build and the Playwright suite.
package main

import (
	"flag"
	"log"
	"mime"
	"net/http"
)

func main() {
	addr := flag.String("addr", ":8090", "listen address")
	flag.Parse()
	// Browsers compile wasm by streaming only when it is served as application/wasm.
	if err := mime.AddExtensionType(".wasm", "application/wasm"); err != nil {
		log.Fatal(err)
	}
	log.Printf("serving web/ on %s", *addr)
	log.Fatal(http.ListenAndServe(*addr, http.FileServer(http.Dir("web"))))
}
