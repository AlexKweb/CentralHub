#include "Array.h"

int main() {
    std::cout << "Введите размер массива: ";
    size_t n;
    std::cin >> n;

    Array<int> arr(n);
    std::cout << "Введите " << n << " элементов: ";
    std::cin >> arr;

    std::cout << "Выберите сортировку (1 - вставками, 2 - выбором, 3 - обменом): ";
    int type;
    std::cin >> type;

    switch (type) {
        case 1:
            arr.insertionSort();
            break;
        case 2:
            arr.selectionSort();
            break;
        case 3:
            arr.bubbleSort();
            break;
        default:
            std::cout << "Некорректный выбор";
            return 0;
    }

    std::cout << "Отсортированный массив: " << arr << std::endl;
    return 0;
}
