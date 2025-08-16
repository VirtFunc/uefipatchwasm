#include <QCoreApplication>
#include <QString>
#include <QStringList>
#include <iostream>
#include <fstream>
#include <string>
#include <chrono>
#include <emscripten.h>
#include <emscripten/bind.h>

#include "../version.h"
#include "uefipatch.h"



extern "C" {
    EMSCRIPTEN_KEEPALIVE
    void runPatch() {
        UEFIPatch w;
        auto start = std::chrono::high_resolution_clock::now(); // Start timer
        UINT8 result = w.patchFromFile("/INPUT.ROM", "/patch.txt", "/OUTPUT.ROM");
        auto end = std::chrono::high_resolution_clock::now(); // End timer
        std::chrono::duration<double> duration = end - start;

        switch (result) {
            case ERR_SUCCESS:
                std::cout << "Image patched, " << duration.count() << "s elapsed" << std::endl;
                emscripten_force_exit(1);
                break;
            case ERR_INVALID_PARAMETER:
                std::cout << "Function called with invalid parameter" << std::endl;
                break;
            case ERR_NOTHING_TO_PATCH:
                std::cout << "No patches can be applied to input file" << std::endl;
                break;
            case ERR_UNKNOWN_PATCH_TYPE:
                std::cout << "Unknown patch type" << std::endl;
                break;
            case ERR_PATCH_OFFSET_OUT_OF_BOUNDS:
                std::cout << "Patch offset out of bounds" << std::endl;
                break;
            case ERR_INVALID_SYMBOL:
                std::cout << "Pattern format mismatch" << std::endl;
                break;
            case ERR_INVALID_FILE:
                std::cout << "File not found or can't be read" << std::endl;
                break;
            case ERR_FILE_OPEN:
                std::cout << "Input file not found" << std::endl;
                break;
            case ERR_FILE_READ:
                std::cout << "Input file can't be read" << std::endl;
                break;
            case ERR_FILE_WRITE:
                std::cout << "Output file can't be written" << std::endl;
                break;
            default:
                std::cout << "Error " << result << std::endl;
        }
    }
}

EMSCRIPTEN_BINDINGS(my_module) {
    emscripten::function("runPatch", &runPatch);
}

int main() {
    return 0;
}
