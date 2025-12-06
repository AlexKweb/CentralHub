#include "Array.h"

int main() {
    std::cout << "Введите размер отсортированного массива: ";
    size_t n;
    std::cin >> n;
    Array<int> arr(n);

    std::cout << "Введите " << n << " элементов: ";
    std::cin >> arr;

    arr.insertionSort();

    std::cout << "Искомое значение: ";
    int target;
    std::cin >> target;

    long pos = arr.binarySearch(target);
    if (pos >= 0) {
        std::cout << "Найдено на позиции " << pos;
    } else {
        std::cout << "Элемент не найден";
    }
    return 0;
}
