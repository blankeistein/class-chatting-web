import Column from "@/Components/LearnReading/Elements/Column";
import Image from "@/Components/LearnReading/Elements/Image";
import Row from "@/Components/LearnReading/Elements/Row";
import Text from "@/Components/LearnReading/Elements/Text";
import ColumnProperties from "./Properties/ColumnProperties";
import ImageProperties from "./Properties/ImageProperties";
import RowProperties from "./Properties/RowProperties";
import TextProperties from "./Properties/TextProperties";

export const PROPERTIES_MAP = {
    Column: ColumnProperties,
    Row: RowProperties,
    Text: TextProperties,
    Image: ImageProperties,
};

export const COMPONENT_MAP = {
    Row,
    Column,
    Text,
    Image,
};
